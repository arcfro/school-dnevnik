import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { jobs, notifications } from '../../server/db/schema'
import { createClass } from '../../server/services/classes.service'
import { createHomework } from '../../server/services/homework.service'
import { saveGrades } from '../../server/services/journal.service'
import { linkParentStudent } from '../../server/services/parent-students.service'
import { createStudent } from '../../server/services/students.service'
import { assignClassSubject, createSubject } from '../../server/services/subjects.service'
import { adminCreateUser } from '../../server/services/users.service'
import type { SessionUser } from '../../server/services/users.service'
import { createTestDb, resetTestDb } from '../helpers/db'

const admin: SessionUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'admin@school.local',
  role: 'admin',
  name: 'Админ',
}

function isoDate(offsetDays = 0) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function seedNotify() {
  const teacher = await adminCreateUser(
    admin,
    { email: 't@school.local', password: 'secret1', name: 'Иванов', role: 'teacher' },
    { bitrixEnabled: false },
  )
  const klass = await createClass(admin, { name: '5А' })
  const otherClass = await createClass(admin, { name: '6Б' })
  const math = await createSubject(admin, { name: 'Математика' })
  await assignClassSubject(admin, {
    classId: klass.id,
    subjectId: math.id,
    teacherUserId: teacher.id,
  })
  const student = await createStudent(admin, { classId: klass.id, name: 'Иванов Иван' })
  const classmate = await createStudent(admin, { classId: klass.id, name: 'Петрова Анна' })
  const parent = await adminCreateUser(
    admin,
    { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
    { bitrixEnabled: false },
  )
  const otherParent = await adminCreateUser(
    admin,
    { email: 'p2@school.local', password: 'secret1', name: 'Другой', role: 'parent' },
    { bitrixEnabled: false },
  )
  await linkParentStudent(admin, { parentUserId: parent.id, studentId: student.id })
  return { teacher, klass, otherClass, math, student, classmate, parent, otherParent }
}

describe('notifications', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('creates a notification and SEND_PUSH job for the parent when a grade is created', async () => {
    const { useDb } = await import('../../server/utils/db')
    const { teacher, klass, math, student, parent } = await seedNotify()

    const saved = await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: isoDate(),
      entries: [{ studentId: student.id, value: '5' }],
    })

    const rows = await useDb()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, parent.id))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: parent.id,
      type: 'grade',
      readAt: null,
      payload: expect.objectContaining({
        studentId: student.id,
        studentName: 'Иванов Иван',
        subjectId: math.id,
        subjectName: 'Математика',
        value: '5',
        date: isoDate(),
        gradeId: saved[0]?.id,
      }),
    })

    const pushJobs = await useDb().select().from(jobs)
    expect(pushJobs).toEqual([
      expect.objectContaining({
        type: 'SEND_PUSH',
        status: 'pending',
        payload: { userId: parent.id, notificationId: rows[0]!.id },
      }),
    ])
  })

  it('does not notify again when the same grade is updated', async () => {
    const { useDb } = await import('../../server/utils/db')
    const { teacher, klass, math, student, parent } = await seedNotify()

    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: isoDate(),
      entries: [{ studentId: student.id, value: '3' }],
    })
    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: isoDate(),
      entries: [{ studentId: student.id, value: '5' }],
    })

    const rows = await useDb()
      .select()
      .from(notifications)
      .where(eq(notifications.userId, parent.id))
    expect(rows).toHaveLength(1)
    expect(rows[0]?.payload).toMatchObject({ value: '3' })
  })

  it('does not notify when the student has no linked parent', async () => {
    const { useDb } = await import('../../server/utils/db')
    const { teacher, klass, math, classmate } = await seedNotify()

    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: isoDate(),
      entries: [{ studentId: classmate.id, value: '4' }],
    })

    const rows = await useDb().select().from(notifications)
    expect(rows).toHaveLength(0)
    const pushJobs = await useDb().select().from(jobs)
    expect(pushJobs).toHaveLength(0)
  })

  it('notifies unique parents of the class when homework is created', async () => {
    const { useDb } = await import('../../server/utils/db')
    const { teacher, klass, math, student, classmate, parent, otherParent } = await seedNotify()
    await linkParentStudent(admin, { parentUserId: otherParent.id, studentId: classmate.id })
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: classmate.id })

    const created = await createHomework(teacher, {
      classId: klass.id,
      subjectId: math.id,
      title: 'Параграф 12',
      body: 'Решить номера 1–5',
    })

    const rows = await useDb().select().from(notifications)
    expect(rows).toHaveLength(2)
    expect(rows.map((r) => r.userId).sort()).toEqual([parent.id, otherParent.id].sort())
    expect(rows.every((r) => r.type === 'homework')).toBe(true)
    expect(rows[0]?.payload).toMatchObject({
      classId: klass.id,
      className: '5А',
      subjectId: math.id,
      subjectName: 'Математика',
      homeworkId: created.id,
      title: 'Параграф 12',
    })
  })

  it('lists only the parent own notifications and unread count', async () => {
    const { listNotifications } = await import('../../server/services/notifications.service')
    const { teacher, klass, math, student, classmate, parent, otherParent } = await seedNotify()
    await linkParentStudent(admin, { parentUserId: otherParent.id, studentId: classmate.id })

    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: isoDate(),
      entries: [
        { studentId: student.id, value: '5' },
        { studentId: classmate.id, value: '4' },
      ],
    })

    const view = await listNotifications(parent)
    expect(view.unreadCount).toBe(1)
    expect(view.items).toHaveLength(1)
    expect(view.items[0]).toMatchObject({
      type: 'grade',
      readAt: null,
      payload: expect.objectContaining({ studentId: student.id, value: '5' }),
    })

    const other = await listNotifications(otherParent)
    expect(other.items[0]?.payload).toMatchObject({ studentId: classmate.id })
  })

  it('marks own notification as read and rejects another user id', async () => {
    const { listNotifications, markNotificationRead } =
      await import('../../server/services/notifications.service')
    const { teacher, klass, math, student, parent, otherParent } = await seedNotify()

    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: isoDate(),
      entries: [{ studentId: student.id, value: '5' }],
    })
    const before = await listNotifications(parent)
    const id = before.items[0]!.id

    await expect(markNotificationRead(otherParent, id)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })

    const marked = await markNotificationRead(parent, id)
    expect(marked.readAt).toBeInstanceOf(Date)

    const after = await listNotifications(parent)
    expect(after.unreadCount).toBe(0)
    expect(after.items[0]?.readAt).toBeInstanceOf(Date)
  })

  it('rejects teacher listing notifications', async () => {
    const { listNotifications } = await import('../../server/services/notifications.service')
    const { teacher } = await seedNotify()
    await expect(listNotifications(teacher)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })
})
