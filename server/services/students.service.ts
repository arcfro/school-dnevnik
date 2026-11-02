import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { classes, students } from '../db/schema'
import { useDb } from '../utils/db'
import { assertRole, NotFoundError } from '../utils/rbac'
import type { SessionUser } from './users.service'

const idSchema = z.uuid('Некорректный id')

const createStudentSchema = z.object({
  classId: z.uuid('Некорректный класс'),
  name: z.string().trim().min(1, 'Укажите имя ученика'),
})

const updateStudentSchema = z.object({
  name: z.string().trim().min(1, 'Укажите имя ученика').optional(),
  classId: z.uuid('Некорректный класс').optional(),
})

async function requireClass(classId: string) {
  const db = useDb()
  const rows = await db.select({ id: classes.id }).from(classes).where(eq(classes.id, classId)).limit(1)
  if (!rows[0]) throw new NotFoundError('Класс не найден')
}

export async function createStudent(user: SessionUser, input: unknown) {
  assertRole(user, 'admin')
  const data = createStudentSchema.parse(input)
  await requireClass(data.classId)
  const db = useDb()
  const rows = await db
    .insert(students)
    .values({ classId: data.classId, name: data.name })
    .returning()
  const created = rows[0]
  if (!created) throw new Error('Failed to create student')
  return created
}

export async function listStudents(user: SessionUser, classId?: string) {
  assertRole(user, 'admin')
  const db = useDb()
  if (classId) {
    const id = idSchema.parse(classId)
    return db
      .select({
        id: students.id,
        name: students.name,
        classId: students.classId,
        className: classes.name,
      })
      .from(students)
      .innerJoin(classes, eq(students.classId, classes.id))
      .where(eq(students.classId, id))
      .orderBy(students.name)
  }
  return db
    .select({
      id: students.id,
      name: students.name,
      classId: students.classId,
      className: classes.name,
    })
    .from(students)
    .innerJoin(classes, eq(students.classId, classes.id))
    .orderBy(classes.name, students.name)
}

export async function updateStudent(user: SessionUser, id: string, input: unknown) {
  assertRole(user, 'admin')
  const studentId = idSchema.parse(id)
  const data = updateStudentSchema.parse(input)
  if (data.classId) await requireClass(data.classId)
  const db = useDb()
  const existing = await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)).limit(1)
  if (!existing[0]) throw new NotFoundError('Ученик не найден')
  const patch: { name?: string; classId?: string; updatedAt: Date } = { updatedAt: new Date() }
  if (data.name !== undefined) patch.name = data.name
  if (data.classId !== undefined) patch.classId = data.classId
  const rows = await db.update(students).set(patch).where(eq(students.id, studentId)).returning()
  const updated = rows[0]
  if (!updated) throw new NotFoundError('Ученик не найден')
  return updated
}

export async function deleteStudent(user: SessionUser, id: string) {
  assertRole(user, 'admin')
  const studentId = idSchema.parse(id)
  const db = useDb()
  const rows = await db.delete(students).where(eq(students.id, studentId)).returning({ id: students.id })
  if (!rows[0]) throw new NotFoundError('Ученик не найден')
  return { ok: true }
}
