import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { createClass } from '../../server/services/classes.service'
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

const parentActor: SessionUser = {
  id: '33333333-3333-4333-8333-333333333333',
  email: 'parent@school.local',
  role: 'parent',
  name: 'Родитель',
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

async function seedHomework() {
  const teacher = await adminCreateUser(
    admin,
    { email: 't@school.local', password: 'secret1', name: 'Иванов', role: 'teacher' },
    { bitrixEnabled: false },
  )
  const other = await adminCreateUser(
    admin,
    { email: 't2@school.local', password: 'secret1', name: 'Петров', role: 'teacher' },
    { bitrixEnabled: false },
  )
  const klass = await createClass(admin, { name: '5А' })
  const otherClass = await createClass(admin, { name: '6Б' })
  const math = await createSubject(admin, { name: 'Математика' })
  const physics = await createSubject(admin, { name: 'Физика' })
  await assignClassSubject(admin, {
    classId: klass.id,
    subjectId: math.id,
    teacherUserId: teacher.id,
  })
  await assignClassSubject(admin, {
    classId: klass.id,
    subjectId: physics.id,
    teacherUserId: other.id,
  })
  await assignClassSubject(admin, {
    classId: otherClass.id,
    subjectId: math.id,
    teacherUserId: other.id,
  })
  const student = await createStudent(admin, { classId: klass.id, name: 'Иванов Иван' })
  const stranger = await createStudent(admin, { classId: otherClass.id, name: 'Чужой' })
  return { teacher, other, klass, otherClass, math, physics, student, stranger }
}

describe('homework', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('rejects teacher creating homework for unassigned class/subject', async () => {
    const { createHomework } = await import('../../server/services/homework.service')
    const { teacher, otherClass, math } = await seedHomework()

    await expect(
      createHomework(teacher, {
        classId: otherClass.id,
        subjectId: math.id,
        title: 'Параграф 12',
        body: 'Решить номера 1–5',
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects teacher creating homework for another teacher subject', async () => {
    const { createHomework } = await import('../../server/services/homework.service')
    const { teacher, klass, physics } = await seedHomework()

    await expect(
      createHomework(teacher, {
        classId: klass.id,
        subjectId: physics.id,
        title: 'Лабораторная',
        body: 'Отчёт',
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects parent creating homework', async () => {
    const { createHomework } = await import('../../server/services/homework.service')
    await expect(
      createHomework(parentActor, {
        classId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        subjectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        title: 'ДЗ',
        body: 'Текст',
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('creates homework for assigned class/subject and lists it for the class', async () => {
    const { createHomework, listHomeworkForClass } =
      await import('../../server/services/homework.service')
    const { teacher, klass, math } = await seedHomework()

    const created = await createHomework(teacher, {
      classId: klass.id,
      subjectId: math.id,
      title: 'Параграф 12',
      body: 'Решить номера 1–5',
      dueAt: isoDate(2),
    })
    expect(created).toMatchObject({
      classId: klass.id,
      subjectId: math.id,
      title: 'Параграф 12',
      body: 'Решить номера 1–5',
      dueAt: isoDate(2),
      createdBy: teacher.id,
    })

    const list = await listHomeworkForClass(teacher, klass.id)
    expect(list.className).toBe('5А')
    expect(list.items).toEqual([
      expect.objectContaining({
        id: created.id,
        subjectName: 'Математика',
        title: 'Параграф 12',
        dueAt: isoDate(2),
      }),
    ])
  })

  it('rejects listing homework for a class the teacher does not teach', async () => {
    const { listHomeworkForClass } = await import('../../server/services/homework.service')
    const { teacher, otherClass } = await seedHomework()

    await expect(listHomeworkForClass(teacher, otherClass.id)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects empty title', async () => {
    const { createHomework } = await import('../../server/services/homework.service')
    const { teacher, klass, math } = await seedHomework()

    await expect(
      createHomework(teacher, {
        classId: klass.id,
        subjectId: math.id,
        title: '   ',
        body: 'Текст',
      }),
    ).rejects.toBeInstanceOf(ZodError)
  })

  it('rejects parent reading another student homework', async () => {
    const { listHomeworkForParent } = await import('../../server/services/homework.service')
    const { student, stranger } = await seedHomework()
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: student.id })

    await expect(listHomeworkForParent(parent, stranger.id)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('returns linked child class homework that is due today, later, or without due date', async () => {
    const { createHomework, listHomeworkForParent } =
      await import('../../server/services/homework.service')
    const { teacher, other, klass, otherClass, math, student } = await seedHomework()
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: student.id })

    await createHomework(teacher, {
      classId: klass.id,
      subjectId: math.id,
      title: 'Сегодня',
      body: 'Активное',
      dueAt: isoDate(0),
    })
    await createHomework(teacher, {
      classId: klass.id,
      subjectId: math.id,
      title: 'Завтра',
      body: 'Ещё не срок',
      dueAt: isoDate(1),
    })
    await createHomework(teacher, {
      classId: klass.id,
      subjectId: math.id,
      title: 'Без срока',
      body: 'Открытое',
      dueAt: null,
    })
    await createHomework(teacher, {
      classId: klass.id,
      subjectId: math.id,
      title: 'Просрочено',
      body: 'Вчера',
      dueAt: isoDate(-1),
    })
    await createHomework(other, {
      classId: otherClass.id,
      subjectId: math.id,
      title: 'Чужой класс',
      body: 'Не должно быть видно',
      dueAt: isoDate(1),
    })

    const view = await listHomeworkForParent(parent, student.id)
    expect(view.studentId).toBe(student.id)
    expect(view.className).toBe('5А')
    expect(view.items.map((item) => item.title).sort()).toEqual(['Без срока', 'Завтра', 'Сегодня'])
  })
})
