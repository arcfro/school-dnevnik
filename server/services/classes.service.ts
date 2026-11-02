import { count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { classes, students } from '../db/schema'
import { useDb } from '../utils/db'
import { assertRole, NotFoundError } from '../utils/rbac'
import type { SessionUser } from './users.service'

const idSchema = z.uuid('Некорректный id')

const createClassSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название класса'),
  gradeLevel: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
})

const updateClassSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название класса').optional(),
  gradeLevel: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
})

export async function createClass(user: SessionUser, input: unknown) {
  assertRole(user, 'admin')
  const data = createClassSchema.parse(input)
  const db = useDb()
  const rows = await db
    .insert(classes)
    .values({
      name: data.name,
      gradeLevel: data.gradeLevel,
    })
    .returning()
  const created = rows[0]
  if (!created) throw new Error('Failed to create class')
  return created
}

export async function listClasses(user: SessionUser) {
  assertRole(user, 'admin')
  const db = useDb()
  return db
    .select({
      id: classes.id,
      name: classes.name,
      gradeLevel: classes.gradeLevel,
      studentCount: count(students.id),
      createdAt: classes.createdAt,
    })
    .from(classes)
    .leftJoin(students, eq(students.classId, classes.id))
    .groupBy(classes.id)
    .orderBy(classes.name)
}

export async function getClass(user: SessionUser, id: string) {
  assertRole(user, 'admin')
  const classId = idSchema.parse(id)
  const db = useDb()
  const rows = await db.select().from(classes).where(eq(classes.id, classId)).limit(1)
  const klass = rows[0]
  if (!klass) throw new NotFoundError('Класс не найден')
  return klass
}

export async function updateClass(user: SessionUser, id: string, input: unknown) {
  assertRole(user, 'admin')
  const classId = idSchema.parse(id)
  const data = updateClassSchema.parse(input)
  const db = useDb()
  const existing = await db.select({ id: classes.id }).from(classes).where(eq(classes.id, classId)).limit(1)
  if (!existing[0]) throw new NotFoundError('Класс не найден')
  const patch: { name?: string; gradeLevel?: string | null; updatedAt: Date } = { updatedAt: new Date() }
  if (data.name !== undefined) patch.name = data.name
  if (data.gradeLevel !== undefined) patch.gradeLevel = data.gradeLevel
  const rows = await db.update(classes).set(patch).where(eq(classes.id, classId)).returning()
  const updated = rows[0]
  if (!updated) throw new NotFoundError('Класс не найден')
  return updated
}

export async function deleteClass(user: SessionUser, id: string) {
  assertRole(user, 'admin')
  const classId = idSchema.parse(id)
  const db = useDb()
  const rows = await db.delete(classes).where(eq(classes.id, classId)).returning({ id: classes.id })
  if (!rows[0]) throw new NotFoundError('Класс не найден')
  return { ok: true }
}
