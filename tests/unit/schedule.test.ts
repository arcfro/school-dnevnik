import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createClass } from '../../server/services/classes.service'
import { linkParentStudent } from '../../server/services/parent-students.service'
import {
  deleteSlot,
  getScheduleForClass,
  getScheduleForParent,
  getScheduleForTeacher,
  upsertSlot,
} from '../../server/services/schedule.service'
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

const teacherActor: SessionUser = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'teacher@school.local',
  role: 'teacher',
  name: 'Учитель',
}

const parentActor: SessionUser = {
  id: '33333333-3333-4333-8333-333333333333',
  email: 'parent@school.local',
  role: 'parent',
  name: 'Родитель',
}

async function seedClass() {
  const teacher = await adminCreateUser(
    admin,
    { email: 't@school.local', password: 'secret1', name: 'Иванов', role: 'teacher' },
    { bitrixEnabled: false },
  )
  const klass = await createClass(admin, { name: '5А' })
  const math = await createSubject(admin, { name: 'Математика' })
  await assignClassSubject(admin, {
    classId: klass.id,
    subjectId: math.id,
    teacherUserId: teacher.id,
  })
  return { teacher, klass, math }
}

describe('schedule', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('rejects teacher upserting a slot', async () => {
    await expect(
      upsertSlot(teacherActor, {
        classId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        dayOfWeek: 1,
        lessonIndex: 1,
        subjectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        teacherUserId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects parent upserting a slot', async () => {
    await expect(
      upsertSlot(parentActor, {
        classId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        dayOfWeek: 1,
        lessonIndex: 1,
        subjectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        teacherUserId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('upserts a slot and lists it for the class', async () => {
    const { teacher, klass, math } = await seedClass()
    const slot = await upsertSlot(admin, {
      classId: klass.id,
      dayOfWeek: 1,
      lessonIndex: 2,
      subjectId: math.id,
      teacherUserId: teacher.id,
      room: '101',
    })
    expect(slot.dayOfWeek).toBe(1)
    expect(slot.lessonIndex).toBe(2)
    expect(slot.room).toBe('101')

    const schedule = await getScheduleForClass(admin, klass.id)
    expect(schedule.className).toBe('5А')
    expect(schedule.slots).toHaveLength(1)
    expect(schedule.slots[0]).toMatchObject({
      id: slot.id,
      subjectName: 'Математика',
      teacherName: 'Иванов',
      room: '101',
    })
  })

  it('upserts the same cell in place instead of duplicating', async () => {
    const { teacher, klass, math } = await seedClass()
    const russian = await createSubject(admin, { name: 'Русский язык' })
    await assignClassSubject(admin, {
      classId: klass.id,
      subjectId: russian.id,
      teacherUserId: teacher.id,
    })

    const first = await upsertSlot(admin, {
      classId: klass.id,
      dayOfWeek: 3,
      lessonIndex: 1,
      subjectId: math.id,
      teacherUserId: teacher.id,
    })
    const second = await upsertSlot(admin, {
      classId: klass.id,
      dayOfWeek: 3,
      lessonIndex: 1,
      subjectId: russian.id,
      teacherUserId: teacher.id,
      room: '202',
    })

    expect(second.id).toBe(first.id)
    const schedule = await getScheduleForClass(admin, klass.id)
    expect(schedule.slots).toHaveLength(1)
    expect(schedule.slots[0]).toMatchObject({
      subjectName: 'Русский язык',
      room: '202',
    })
  })

  it('deletes a slot', async () => {
    const { teacher, klass, math } = await seedClass()
    const slot = await upsertSlot(admin, {
      classId: klass.id,
      dayOfWeek: 5,
      lessonIndex: 8,
      subjectId: math.id,
      teacherUserId: teacher.id,
    })
    await deleteSlot(admin, slot.id)
    const schedule = await getScheduleForClass(admin, klass.id)
    expect(schedule.slots).toHaveLength(0)
  })

  it('rejects teacher reading admin class schedule', async () => {
    const { klass } = await seedClass()
    await expect(getScheduleForClass(teacherActor, klass.id)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('returns only the teacher own slots', async () => {
    const { teacher, klass, math } = await seedClass()
    const other = await adminCreateUser(
      admin,
      { email: 't2@school.local', password: 'secret1', name: 'Петров', role: 'teacher' },
      { bitrixEnabled: false },
    )
    const physics = await createSubject(admin, { name: 'Физика' })
    await assignClassSubject(admin, {
      classId: klass.id,
      subjectId: physics.id,
      teacherUserId: other.id,
    })
    await upsertSlot(admin, {
      classId: klass.id,
      dayOfWeek: 1,
      lessonIndex: 1,
      subjectId: math.id,
      teacherUserId: teacher.id,
    })
    await upsertSlot(admin, {
      classId: klass.id,
      dayOfWeek: 1,
      lessonIndex: 2,
      subjectId: physics.id,
      teacherUserId: other.id,
    })

    const mine = await getScheduleForTeacher(teacher)
    expect(mine.slots).toHaveLength(1)
    expect(mine.slots[0]).toMatchObject({
      subjectName: 'Математика',
      className: '5А',
      teacherName: 'Иванов',
    })
  })

  it('rejects parent reading another student class', async () => {
    const { klass } = await seedClass()
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    const otherClass = await createClass(admin, { name: '6Б' })
    const own = await createStudent(admin, { classId: klass.id, name: 'Иванов Иван' })
    const stranger = await createStudent(admin, { classId: otherClass.id, name: 'Чужой' })
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: own.id })

    await expect(getScheduleForParent(parent, stranger.id)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('returns linked student class schedule for parent', async () => {
    const { teacher, klass, math } = await seedClass()
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    const childA = await createStudent(admin, { classId: klass.id, name: 'Иванов Иван' })
    const otherClass = await createClass(admin, { name: '6Б' })
    const childB = await createStudent(admin, { classId: otherClass.id, name: 'Иванова Анна' })
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: childA.id })
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: childB.id })
    await upsertSlot(admin, {
      classId: klass.id,
      dayOfWeek: 2,
      lessonIndex: 3,
      subjectId: math.id,
      teacherUserId: teacher.id,
      room: '12',
    })

    const schedule = await getScheduleForParent(parent, childA.id)
    expect(schedule.children.map((c) => c.name).sort()).toEqual(['Иванов Иван', 'Иванова Анна'])
    expect(schedule.studentId).toBe(childA.id)
    expect(schedule.className).toBe('5А')
    expect(schedule.slots).toHaveLength(1)
    expect(schedule.slots[0]).toMatchObject({
      subjectName: 'Математика',
      teacherName: 'Иванов',
      room: '12',
    })
  })
})
