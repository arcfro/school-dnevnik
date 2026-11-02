import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { classes, parentStudents, scheduleSlots, students, subjects, users } from '../db/schema'
import { useDb } from '../utils/db'
import { assertRole, ConflictError, ForbiddenError, NotFoundError } from '../utils/rbac'
import type { SessionUser } from './users.service'

const idSchema = z.uuid('Некорректный id')

const upsertSlotSchema = z.object({
  classId: z.uuid('Некорректный класс'),
  dayOfWeek: z.number().int().min(1, 'День недели 1–6').max(6, 'День недели 1–6'),
  lessonIndex: z.number().int().min(1, 'Номер урока 1–8').max(8, 'Номер урока 1–8'),
  subjectId: z.uuid('Некорректный предмет'),
  teacherUserId: z.uuid('Некорректный учитель'),
  room: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null)),
})

const slotSelect = {
  id: scheduleSlots.id,
  classId: scheduleSlots.classId,
  className: classes.name,
  dayOfWeek: scheduleSlots.dayOfWeek,
  lessonIndex: scheduleSlots.lessonIndex,
  subjectId: scheduleSlots.subjectId,
  subjectName: subjects.name,
  teacherUserId: scheduleSlots.teacherUserId,
  teacherName: users.name,
  room: scheduleSlots.room,
}

async function loadSlots(filter: { classId?: string; teacherUserId?: string }) {
  const db = useDb()
  const conditions = []
  if (filter.classId) conditions.push(eq(scheduleSlots.classId, filter.classId))
  if (filter.teacherUserId) conditions.push(eq(scheduleSlots.teacherUserId, filter.teacherUserId))

  const query = db
    .select(slotSelect)
    .from(scheduleSlots)
    .innerJoin(classes, eq(scheduleSlots.classId, classes.id))
    .innerJoin(subjects, eq(scheduleSlots.subjectId, subjects.id))
    .innerJoin(users, eq(scheduleSlots.teacherUserId, users.id))

  const rows = conditions.length
    ? await query.where(and(...conditions)).orderBy(scheduleSlots.dayOfWeek, scheduleSlots.lessonIndex)
    : await query.orderBy(scheduleSlots.dayOfWeek, scheduleSlots.lessonIndex)

  return rows
}

async function requireClass(classId: string) {
  const db = useDb()
  const rows = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1)
  const klass = rows[0]
  if (!klass) throw new NotFoundError('Класс не найден')
  return klass
}

export async function upsertSlot(user: SessionUser, input: unknown) {
  assertRole(user, 'admin')
  const data = upsertSlotSchema.parse(input)
  const db = useDb()

  await requireClass(data.classId)

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

  const existing = await db
    .select({ id: scheduleSlots.id })
    .from(scheduleSlots)
    .where(
      and(
        eq(scheduleSlots.classId, data.classId),
        eq(scheduleSlots.dayOfWeek, data.dayOfWeek),
        eq(scheduleSlots.lessonIndex, data.lessonIndex),
      ),
    )
    .limit(1)

  if (existing[0]) {
    const rows = await db
      .update(scheduleSlots)
      .set({
        subjectId: data.subjectId,
        teacherUserId: data.teacherUserId,
        room: data.room,
        updatedAt: new Date(),
      })
      .where(eq(scheduleSlots.id, existing[0].id))
      .returning()
    const updated = rows[0]
    if (!updated) throw new NotFoundError('Урок не найден')
    return updated
  }

  const rows = await db
    .insert(scheduleSlots)
    .values({
      classId: data.classId,
      dayOfWeek: data.dayOfWeek,
      lessonIndex: data.lessonIndex,
      subjectId: data.subjectId,
      teacherUserId: data.teacherUserId,
      room: data.room,
    })
    .returning()
  const created = rows[0]
  if (!created) throw new Error('Failed to upsert slot')
  return created
}

export async function deleteSlot(user: SessionUser, id: string) {
  assertRole(user, 'admin')
  const slotId = idSchema.parse(id)
  const db = useDb()
  const rows = await db
    .delete(scheduleSlots)
    .where(eq(scheduleSlots.id, slotId))
    .returning({ id: scheduleSlots.id })
  if (!rows[0]) throw new NotFoundError('Урок не найден')
  return { ok: true }
}

export async function getScheduleForClass(user: SessionUser, classId: string) {
  assertRole(user, 'admin')
  const id = idSchema.parse(classId)
  const klass = await requireClass(id)
  const slots = await loadSlots({ classId: id })
  return { classId: klass.id, className: klass.name, slots }
}

export async function getScheduleForTeacher(user: SessionUser) {
  assertRole(user, 'teacher')
  const slots = await loadSlots({ teacherUserId: user.id })
  return { slots }
}

export async function getScheduleForParent(user: SessionUser, studentId?: string | null) {
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
    return { children, studentId: null, classId: null, className: null, slots: [] }
  }

  const slots = await loadSlots({ classId: selected.classId })
  return {
    children,
    studentId: selected.id,
    classId: selected.classId,
    className: selected.className,
    slots,
  }
}
