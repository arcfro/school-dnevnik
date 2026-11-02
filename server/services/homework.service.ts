import { and, desc, eq, gte, isNull, or } from 'drizzle-orm'
import { z } from 'zod'
import {
  classes,
  classSubjects,
  homework,
  parentStudents,
  students,
  subjects,
  users,
} from '../db/schema'
import { useDb } from '../utils/db'
import { assertRole, ForbiddenError } from '../utils/rbac'
import type { SessionUser } from './users.service'

const idSchema = z.uuid('Некорректный id')
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата YYYY-MM-DD')

const createHomeworkSchema = z.object({
  classId: z.uuid('Некорректный класс'),
  subjectId: z.uuid('Некорректный предмет'),
  title: z.string().trim().min(1, 'Укажите название'),
  body: z.string().trim().min(1, 'Укажите текст задания'),
  dueAt: z
    .union([dateSchema, z.literal(''), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
})

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatLocalDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseDueAt(iso: string | null) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d, 12)
}

function formatDueAt(value: Date | null) {
  return value ? formatLocalDate(value) : null
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const homeworkSelect = {
  id: homework.id,
  classId: homework.classId,
  className: classes.name,
  subjectId: homework.subjectId,
  subjectName: subjects.name,
  title: homework.title,
  body: homework.body,
  dueAt: homework.dueAt,
  createdBy: homework.createdBy,
  teacherName: users.name,
  createdAt: homework.createdAt,
}

function mapHomework(row: {
  id: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  title: string
  body: string
  dueAt: Date | null
  createdBy: string
  teacherName: string
  createdAt: Date
}) {
  return {
    ...row,
    dueAt: formatDueAt(row.dueAt),
  }
}

async function listTeacherAssignments(user: SessionUser) {
  const db = useDb()
  return db
    .select({
      classId: classSubjects.classId,
      className: classes.name,
      subjectId: classSubjects.subjectId,
      subjectName: subjects.name,
    })
    .from(classSubjects)
    .innerJoin(classes, eq(classSubjects.classId, classes.id))
    .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
    .where(eq(classSubjects.teacherUserId, user.id))
    .orderBy(classes.name, subjects.name)
}

async function requireTeacherScope(user: SessionUser, classId: string, subjectId: string) {
  assertRole(user, 'teacher')
  const db = useDb()
  const rows = await db
    .select({
      id: classSubjects.id,
      className: classes.name,
      subjectName: subjects.name,
    })
    .from(classSubjects)
    .innerJoin(classes, eq(classSubjects.classId, classes.id))
    .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
    .where(
      and(
        eq(classSubjects.classId, classId),
        eq(classSubjects.subjectId, subjectId),
        eq(classSubjects.teacherUserId, user.id),
      ),
    )
    .limit(1)
  const row = rows[0]
  if (!row) throw new ForbiddenError('Нет доступа к этому классу или предмету')
  return row
}

async function requireTeacherClass(user: SessionUser, classId: string) {
  assertRole(user, 'teacher')
  const db = useDb()
  const rows = await db
    .select({
      classId: classSubjects.classId,
      className: classes.name,
    })
    .from(classSubjects)
    .innerJoin(classes, eq(classSubjects.classId, classes.id))
    .where(and(eq(classSubjects.classId, classId), eq(classSubjects.teacherUserId, user.id)))
    .limit(1)
  const row = rows[0]
  if (!row) throw new ForbiddenError('Нет доступа к этому классу или предмету')
  return row
}

async function loadHomeworkForClass(classId: string, activeOnly: boolean) {
  const db = useDb()
  const conditions = [eq(homework.classId, classId)]
  if (activeOnly) {
    conditions.push(or(isNull(homework.dueAt), gte(homework.dueAt, startOfToday()))!)
  }
  const rows = await db
    .select(homeworkSelect)
    .from(homework)
    .innerJoin(classes, eq(homework.classId, classes.id))
    .innerJoin(subjects, eq(homework.subjectId, subjects.id))
    .innerJoin(users, eq(homework.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(homework.createdAt), subjects.name)
  return rows.map(mapHomework)
}

export async function createHomework(user: SessionUser, input: unknown) {
  assertRole(user, 'teacher')
  const data = createHomeworkSchema.parse(input)
  await requireTeacherScope(user, data.classId, data.subjectId)

  const db = useDb()
  const rows = await db
    .insert(homework)
    .values({
      classId: data.classId,
      subjectId: data.subjectId,
      title: data.title,
      body: data.body,
      dueAt: parseDueAt(data.dueAt),
      createdBy: user.id,
    })
    .returning()
  const created = rows[0]!
  return {
    id: created.id,
    classId: created.classId,
    subjectId: created.subjectId,
    title: created.title,
    body: created.body,
    dueAt: formatDueAt(created.dueAt),
    createdBy: created.createdBy,
  }
}

export async function listHomeworkForClass(user: SessionUser, classId: unknown) {
  const parsedClassId = idSchema.parse(classId)
  const scope = await requireTeacherClass(user, parsedClassId)
  const items = await loadHomeworkForClass(parsedClassId, false)
  return {
    classId: parsedClassId,
    className: scope.className,
    items,
  }
}

export async function getHomeworkForTeacher(user: SessionUser, classId?: string | null) {
  assertRole(user, 'teacher')
  const assignments = await listTeacherAssignments(user)
  const requested = classId ? idSchema.parse(classId) : null
  if (!requested) {
    return {
      assignments,
      classId: null,
      className: null,
      items: [],
    }
  }
  const list = await listHomeworkForClass(user, requested)
  return {
    assignments,
    classId: list.classId,
    className: list.className,
    items: list.items,
  }
}

export async function listHomeworkForParent(user: SessionUser, studentId?: string | null) {
  assertRole(user, 'parent')
  const requestedId = studentId ? idSchema.parse(studentId) : null
  const db = useDb()

  const children = await db
    .select({
      id: students.id,
      name: students.name,
      classId: students.classId,
      className: classes.name,
    })
    .from(parentStudents)
    .innerJoin(students, eq(parentStudents.studentId, students.id))
    .innerJoin(classes, eq(students.classId, classes.id))
    .where(eq(parentStudents.parentUserId, user.id))
    .orderBy(students.name)

  if (requestedId && !children.some((c) => c.id === requestedId)) {
    throw new ForbiddenError('Нет доступа к этому ученику')
  }

  const selected = requestedId ? children.find((c) => c.id === requestedId) : children[0]
  if (!selected) {
    return {
      children,
      studentId: null,
      studentName: null,
      classId: null,
      className: null,
      items: [],
    }
  }

  const items = await loadHomeworkForClass(selected.classId, true)
  return {
    children,
    studentId: selected.id,
    studentName: selected.name,
    classId: selected.classId,
    className: selected.className,
    items,
  }
}
