import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { classes, classSubjects, subjects, users } from '../db/schema'
import { useDb } from '../utils/db'
import { assertRole, ConflictError, NotFoundError } from '../utils/rbac'
import type { SessionUser } from './users.service'

const idSchema = z.uuid('Некорректный id')

const createSubjectSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название предмета'),
})

const updateSubjectSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название предмета'),
})

const assignClassSubjectSchema = z.object({
  classId: z.uuid('Некорректный класс'),
  subjectId: z.uuid('Некорректный предмет'),
  teacherUserId: z.uuid('Некорректный учитель'),
})

export async function createSubject(user: SessionUser, input: unknown) {
  assertRole(user, 'admin')
  const data = createSubjectSchema.parse(input)
  const db = useDb()
  const rows = await db.insert(subjects).values({ name: data.name }).returning()
  const created = rows[0]
  if (!created) throw new Error('Failed to create subject')
  return created
}

export async function listSubjects(user: SessionUser) {
  assertRole(user, 'admin')
  const db = useDb()
  return db.select().from(subjects).orderBy(subjects.name)
}

export async function updateSubject(user: SessionUser, id: string, input: unknown) {
  assertRole(user, 'admin')
  const subjectId = idSchema.parse(id)
  const data = updateSubjectSchema.parse(input)
  const db = useDb()
  const rows = await db
    .update(subjects)
    .set({ name: data.name, updatedAt: new Date() })
    .where(eq(subjects.id, subjectId))
    .returning()
  const updated = rows[0]
  if (!updated) throw new NotFoundError('Предмет не найден')
  return updated
}

export async function deleteSubject(user: SessionUser, id: string) {
  assertRole(user, 'admin')
  const subjectId = idSchema.parse(id)
  const db = useDb()
  const rows = await db.delete(subjects).where(eq(subjects.id, subjectId)).returning({ id: subjects.id })
  if (!rows[0]) throw new NotFoundError('Предмет не найден')
  return { ok: true }
}

export async function assignClassSubject(user: SessionUser, input: unknown) {
  assertRole(user, 'admin')
  const data = assignClassSubjectSchema.parse(input)
  const db = useDb()

  const klass = await db.select({ id: classes.id }).from(classes).where(eq(classes.id, data.classId)).limit(1)
  if (!klass[0]) throw new NotFoundError('Класс не найден')

  const subject = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.id, data.subjectId))
    .limit(1)
  if (!subject[0]) throw new NotFoundError('Предмет не найден')

  const teacher = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, data.teacherUserId))
    .limit(1)
  if (!teacher[0]) throw new NotFoundError('Учитель не найден')
  if (teacher[0].role !== 'teacher') {
    throw new ConflictError('Нужен пользователь с ролью учителя')
  }

  const duplicate = await db
    .select({ id: classSubjects.id })
    .from(classSubjects)
    .where(
      and(eq(classSubjects.classId, data.classId), eq(classSubjects.subjectId, data.subjectId)),
    )
    .limit(1)
  if (duplicate[0]) throw new ConflictError('Предмет уже назначен этому классу')

  const rows = await db
    .insert(classSubjects)
    .values({
      classId: data.classId,
      subjectId: data.subjectId,
      teacherUserId: data.teacherUserId,
    })
    .returning()
  const created = rows[0]
  if (!created) throw new Error('Failed to assign subject')
  return created
}

export async function listClassSubjects(user: SessionUser, classId: string) {
  assertRole(user, 'admin')
  const id = idSchema.parse(classId)
  const db = useDb()
  return db
    .select({
      id: classSubjects.id,
      classId: classSubjects.classId,
      subjectId: classSubjects.subjectId,
      teacherUserId: classSubjects.teacherUserId,
      subjectName: subjects.name,
      teacherName: users.name,
    })
    .from(classSubjects)
    .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
    .innerJoin(users, eq(classSubjects.teacherUserId, users.id))
    .where(eq(classSubjects.classId, id))
    .orderBy(subjects.name)
}

export async function unassignClassSubject(user: SessionUser, id: string) {
  assertRole(user, 'admin')
  const assignmentId = idSchema.parse(id)
  const db = useDb()
  const rows = await db
    .delete(classSubjects)
    .where(eq(classSubjects.id, assignmentId))
    .returning({ id: classSubjects.id })
  if (!rows[0]) throw new NotFoundError('Назначение не найдено')
  return { ok: true }
}
