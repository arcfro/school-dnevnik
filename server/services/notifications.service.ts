import { desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { classes, notifications, parentStudents, students, subjects } from '../db/schema'
import { enqueueJob } from './jobs.service'
import { useDb } from '../utils/db'
import { assertRole, ForbiddenError, NotFoundError } from '../utils/rbac'
import type { SessionUser } from './users.service'

const idSchema = z.uuid('Некорректный id')

export type NotificationType = 'grade' | 'homework'

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
) {
  const db = useDb()
  const rows = await db
    .insert(notifications)
    .values({ userId, type, payload })
    .returning()
  const created = rows[0]
  if (!created) throw new Error('Failed to create notification')
  return created
}

async function notifyUser(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
) {
  const created = await createNotification(userId, type, payload)
  await enqueueJob('SEND_PUSH', { userId, notificationId: created.id })
  return created
}

export async function notifyParentsOfGrade(input: {
  studentId: string
  subjectId: string
  value: string
  date: string
  gradeId: string
}) {
  const db = useDb()
  const studentRows = await db
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(eq(students.id, input.studentId))
    .limit(1)
  const student = studentRows[0]
  if (!student) return

  const subjectRows = await db
    .select({ id: subjects.id, name: subjects.name })
    .from(subjects)
    .where(eq(subjects.id, input.subjectId))
    .limit(1)

  const parents = await db
    .select({ parentUserId: parentStudents.parentUserId })
    .from(parentStudents)
    .where(eq(parentStudents.studentId, input.studentId))

  const payload = {
    studentId: student.id,
    studentName: student.name,
    subjectId: input.subjectId,
    subjectName: subjectRows[0]?.name ?? '',
    value: input.value,
    date: input.date,
    gradeId: input.gradeId,
  }

  for (const parent of parents) {
    await notifyUser(parent.parentUserId, 'grade', payload)
  }
}

export async function notifyParentsOfHomework(input: {
  classId: string
  subjectId: string
  homeworkId: string
  title: string
  dueAt: string | null
}) {
  const db = useDb()
  const classRows = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.id, input.classId))
    .limit(1)
  const subjectRows = await db
    .select({ id: subjects.id, name: subjects.name })
    .from(subjects)
    .where(eq(subjects.id, input.subjectId))
    .limit(1)

  const classStudents = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.classId, input.classId))
  const studentIds = classStudents.map((s) => s.id)
  if (!studentIds.length) return

  const parents = await db
    .select({ parentUserId: parentStudents.parentUserId })
    .from(parentStudents)
    .where(inArray(parentStudents.studentId, studentIds))

  const uniqueParentIds = [...new Set(parents.map((p) => p.parentUserId))]
  const payload = {
    classId: input.classId,
    className: classRows[0]?.name ?? '',
    subjectId: input.subjectId,
    subjectName: subjectRows[0]?.name ?? '',
    homeworkId: input.homeworkId,
    title: input.title,
    dueAt: input.dueAt,
  }

  for (const parentUserId of uniqueParentIds) {
    await notifyUser(parentUserId, 'homework', payload)
  }
}

export async function listNotifications(user: SessionUser) {
  assertRole(user, 'parent')
  const db = useDb()
  const items = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      payload: notifications.payload,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))

  return {
    unreadCount: items.filter((item) => !item.readAt).length,
    items,
  }
}

export async function markNotificationRead(user: SessionUser, id: string) {
  assertRole(user, 'parent')
  const notificationId = idSchema.parse(id)
  const db = useDb()
  const rows = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      readAt: notifications.readAt,
    })
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1)
  const found = rows[0]
  if (!found) throw new NotFoundError('Уведомление не найдено')
  if (found.userId !== user.id) throw new ForbiddenError('Нет доступа к этому уведомлению')

  if (found.readAt) {
    return {
      id: found.id,
      readAt: found.readAt,
    }
  }

  const updated = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, notificationId))
    .returning({
      id: notifications.id,
      readAt: notifications.readAt,
    })
  return updated[0]!
}
