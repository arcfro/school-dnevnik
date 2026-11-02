import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { classes, parentStudents, students, users } from '../db/schema'
import { useDb } from '../utils/db'
import { assertRole, ConflictError, NotFoundError } from '../utils/rbac'
import type { SessionUser } from './users.service'

const idSchema = z.uuid('Некорректный id')

const linkSchema = z.object({
  parentUserId: z.uuid('Некорректный родитель'),
  studentId: z.uuid('Некорректный ученик'),
})

export async function linkParentStudent(actor: SessionUser, input: unknown) {
  assertRole(actor, 'admin')
  const data = linkSchema.parse(input)
  const db = useDb()

  const parent = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, data.parentUserId))
    .limit(1)
  if (!parent[0]) throw new NotFoundError('Родитель не найден')
  if (parent[0].role !== 'parent') {
    throw new ConflictError('Нужен пользователь с ролью родителя')
  }

  const student = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.id, data.studentId))
    .limit(1)
  if (!student[0]) throw new NotFoundError('Ученик не найден')

  const duplicate = await db
    .select({ id: parentStudents.id })
    .from(parentStudents)
    .where(
      and(
        eq(parentStudents.parentUserId, data.parentUserId),
        eq(parentStudents.studentId, data.studentId),
      ),
    )
    .limit(1)
  if (duplicate[0]) throw new ConflictError('Этот ученик уже привязан к родителю')

  const rows = await db
    .insert(parentStudents)
    .values({
      parentUserId: data.parentUserId,
      studentId: data.studentId,
    })
    .returning()
  const created = rows[0]
  if (!created) throw new Error('Failed to link parent and student')
  return created
}

export async function listParentStudents(actor: SessionUser, parentUserId: string) {
  assertRole(actor, 'admin')
  const id = idSchema.parse(parentUserId)
  const db = useDb()
  return db
    .select({
      id: parentStudents.id,
      parentUserId: parentStudents.parentUserId,
      studentId: parentStudents.studentId,
      studentName: students.name,
      classId: students.classId,
      className: classes.name,
      createdAt: parentStudents.createdAt,
    })
    .from(parentStudents)
    .innerJoin(students, eq(parentStudents.studentId, students.id))
    .innerJoin(classes, eq(students.classId, classes.id))
    .where(eq(parentStudents.parentUserId, id))
    .orderBy(students.name)
}

export async function unlinkParentStudent(actor: SessionUser, id: string) {
  assertRole(actor, 'admin')
  const linkId = idSchema.parse(id)
  const db = useDb()
  const rows = await db
    .delete(parentStudents)
    .where(eq(parentStudents.id, linkId))
    .returning({ id: parentStudents.id })
  if (!rows[0]) throw new NotFoundError('Связь не найдена')
  return { ok: true }
}
