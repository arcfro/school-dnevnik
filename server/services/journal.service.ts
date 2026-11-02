import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import { z } from 'zod'
import {
  attendance,
  classes,
  classSubjects,
  gradeEntries,
  parentStudents,
  students,
  subjects,
  users,
} from '../db/schema'
import { useDb } from '../utils/db'
import { assertRole, ConflictError, ForbiddenError } from '../utils/rbac'
import type { SessionUser } from './users.service'

const idSchema = z.uuid('Некорректный id')
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата YYYY-MM-DD')

const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused'])

const saveGradesSchema = z.object({
  classId: z.uuid('Некорректный класс'),
  subjectId: z.uuid('Некорректный предмет'),
  date: dateSchema,
  entries: z.array(
    z.object({
      studentId: z.uuid('Некорректный ученик'),
      value: z.string(),
      type: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((v) => v || null),
      comment: z
        .string()
        .trim()
        .optional()
        .nullable()
        .transform((v) => v || null),
    }),
  ),
})

const saveAttendanceSchema = z.object({
  classId: z.uuid('Некорректный класс'),
  subjectId: z.uuid('Некорректный предмет'),
  date: dateSchema,
  entries: z.array(
    z.object({
      studentId: z.uuid('Некорректный ученик'),
      status: z.union([z.literal(''), attendanceStatusSchema]),
    }),
  ),
})

const teacherJournalQuerySchema = z.object({
  classId: z.uuid('Некорректный класс').optional(),
  subjectId: z.uuid('Некорректный предмет').optional(),
  date: dateSchema.optional(),
})

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function formatLocalDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayIso() {
  return formatLocalDate(new Date())
}

export function addDaysIso(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y!, m! - 1, d, 12)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
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

async function requireStudentsInClass(classId: string, studentIds: string[]) {
  const unique = [...new Set(studentIds)]
  if (!unique.length) return
  const db = useDb()
  const rows = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.classId, classId), inArray(students.id, unique)))
  if (rows.length !== unique.length) {
    throw new ConflictError('Ученик не в этом классе')
  }
}

export async function saveGrades(user: SessionUser, input: unknown) {
  assertRole(user, 'teacher')
  const data = saveGradesSchema.parse(input)
  await requireTeacherScope(user, data.classId, data.subjectId)
  await requireStudentsInClass(
    data.classId,
    data.entries.map((e) => e.studentId),
  )

  const db = useDb()
  const saved = []
  for (const entry of data.entries) {
    const value = entry.value.trim()
    const existing = await db
      .select({ id: gradeEntries.id })
      .from(gradeEntries)
      .where(
        and(
          eq(gradeEntries.studentId, entry.studentId),
          eq(gradeEntries.subjectId, data.subjectId),
          eq(gradeEntries.date, data.date),
        ),
      )
      .limit(1)

    if (!value) {
      if (existing[0]) {
        await db.delete(gradeEntries).where(eq(gradeEntries.id, existing[0].id))
      }
      continue
    }

    if (existing[0]) {
      const rows = await db
        .update(gradeEntries)
        .set({
          value,
          type: entry.type,
          comment: entry.comment,
          teacherUserId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(gradeEntries.id, existing[0].id))
        .returning()
      const updated = rows[0]
      if (updated) saved.push(updated)
      continue
    }

    const rows = await db
      .insert(gradeEntries)
      .values({
        studentId: entry.studentId,
        subjectId: data.subjectId,
        date: data.date,
        value,
        type: entry.type,
        comment: entry.comment,
        teacherUserId: user.id,
      })
      .returning()
    const created = rows[0]
    if (created) saved.push(created)
  }
  return saved
}

export async function saveAttendance(user: SessionUser, input: unknown) {
  assertRole(user, 'teacher')
  const data = saveAttendanceSchema.parse(input)
  await requireTeacherScope(user, data.classId, data.subjectId)
  await requireStudentsInClass(
    data.classId,
    data.entries.map((e) => e.studentId),
  )

  const db = useDb()
  const saved = []
  for (const entry of data.entries) {
    const existing = await db
      .select({ id: attendance.id })
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, entry.studentId),
          eq(attendance.subjectId, data.subjectId),
          eq(attendance.date, data.date),
        ),
      )
      .limit(1)

    if (!entry.status) {
      if (existing[0]) {
        await db.delete(attendance).where(eq(attendance.id, existing[0].id))
      }
      continue
    }

    if (existing[0]) {
      const rows = await db
        .update(attendance)
        .set({
          status: entry.status,
          teacherUserId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(attendance.id, existing[0].id))
        .returning()
      const updated = rows[0]
      if (updated) saved.push(updated)
      continue
    }

    const rows = await db
      .insert(attendance)
      .values({
        studentId: entry.studentId,
        subjectId: data.subjectId,
        date: data.date,
        status: entry.status,
        teacherUserId: user.id,
      })
      .returning()
    const created = rows[0]
    if (created) saved.push(created)
  }
  return saved
}

export async function getJournalForTeacher(user: SessionUser, query: unknown) {
  assertRole(user, 'teacher')
  const parsed = teacherJournalQuerySchema.parse(query)
  const assignments = await listTeacherAssignments(user)
  if (!parsed.classId && !parsed.subjectId && !parsed.date) {
    return {
      assignments,
      classId: null,
      className: null,
      subjectId: null,
      subjectName: null,
      date: null,
      students: [],
    }
  }

  const data = z
    .object({
      classId: z.uuid('Некорректный класс'),
      subjectId: z.uuid('Некорректный предмет'),
      date: dateSchema,
    })
    .parse(parsed)

  const scope = await requireTeacherScope(user, data.classId, data.subjectId)
  const db = useDb()
  const roster = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.classId, data.classId))
    .orderBy(students.name)

  const studentIds = roster.map((s) => s.id)
  const gradeRows = studentIds.length
    ? await db
        .select({
          id: gradeEntries.id,
          studentId: gradeEntries.studentId,
          value: gradeEntries.value,
          type: gradeEntries.type,
          comment: gradeEntries.comment,
        })
        .from(gradeEntries)
        .where(
          and(
            inArray(gradeEntries.studentId, studentIds),
            eq(gradeEntries.subjectId, data.subjectId),
            eq(gradeEntries.date, data.date),
          ),
        )
    : []
  const attendanceRows = studentIds.length
    ? await db
        .select({
          id: attendance.id,
          studentId: attendance.studentId,
          status: attendance.status,
        })
        .from(attendance)
        .where(
          and(
            inArray(attendance.studentId, studentIds),
            eq(attendance.subjectId, data.subjectId),
            eq(attendance.date, data.date),
          ),
        )
    : []

  const gradeByStudent = new Map(gradeRows.map((g) => [g.studentId, g]))
  const attendanceByStudent = new Map(attendanceRows.map((a) => [a.studentId, a]))

  return {
    assignments,
    classId: data.classId,
    className: scope.className,
    subjectId: data.subjectId,
    subjectName: scope.subjectName,
    date: data.date,
    students: roster.map((s) => {
      const grade = gradeByStudent.get(s.id)
      const mark = attendanceByStudent.get(s.id)
      return {
        id: s.id,
        name: s.name,
        grade: grade
          ? { id: grade.id, value: grade.value, type: grade.type, comment: grade.comment }
          : null,
        attendance: mark ? { id: mark.id, status: mark.status } : null,
      }
    }),
  }
}

export async function getGradesForParent(user: SessionUser, studentId?: string | null) {
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
  const to = todayIso()
  const from = addDaysIso(to, -30)
  if (!selected) {
    return {
      children,
      studentId: null,
      studentName: null,
      className: null,
      from,
      to,
      grades: [],
      attendance: [],
    }
  }

  const grades = await db
    .select({
      id: gradeEntries.id,
      date: gradeEntries.date,
      subjectId: gradeEntries.subjectId,
      subjectName: subjects.name,
      value: gradeEntries.value,
      type: gradeEntries.type,
      comment: gradeEntries.comment,
      teacherName: users.name,
    })
    .from(gradeEntries)
    .innerJoin(subjects, eq(gradeEntries.subjectId, subjects.id))
    .innerJoin(users, eq(gradeEntries.teacherUserId, users.id))
    .where(
      and(
        eq(gradeEntries.studentId, selected.id),
        gte(gradeEntries.date, from),
        lte(gradeEntries.date, to),
      ),
    )
    .orderBy(desc(gradeEntries.date), subjects.name)

  const marks = await db
    .select({
      id: attendance.id,
      date: attendance.date,
      subjectId: attendance.subjectId,
      subjectName: subjects.name,
      status: attendance.status,
    })
    .from(attendance)
    .innerJoin(subjects, eq(attendance.subjectId, subjects.id))
    .where(
      and(
        eq(attendance.studentId, selected.id),
        gte(attendance.date, from),
        lte(attendance.date, to),
      ),
    )
    .orderBy(desc(attendance.date), subjects.name)

  return {
    children,
    studentId: selected.id,
    studentName: selected.name,
    className: selected.className,
    from,
    to,
    grades,
    attendance: marks,
  }
}
