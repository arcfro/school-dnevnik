import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createClass } from '../../server/services/classes.service'
import { createStudent } from '../../server/services/students.service'
import {
  linkParentStudent,
  listParentStudents,
  unlinkParentStudent,
} from '../../server/services/parent-students.service'
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

describe('parent_students', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('rejects teacher linking a parent to a student', async () => {
    await expect(
      linkParentStudent(teacherActor, {
        parentUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        studentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('links one parent to multiple students', async () => {
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    const klass = await createClass(admin, { name: '5А' })
    const childA = await createStudent(admin, { classId: klass.id, name: 'Иванов Иван' })
    const childB = await createStudent(admin, { classId: klass.id, name: 'Иванова Анна' })

    await linkParentStudent(admin, { parentUserId: parent.id, studentId: childA.id })
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: childB.id })

    const links = await listParentStudents(admin, parent.id)
    expect(links).toHaveLength(2)
    expect(links.map((l) => l.studentName).sort()).toEqual(['Иванов Иван', 'Иванова Анна'])
    expect(links.every((l) => l.className === '5А')).toBe(true)
  })

  it('rejects duplicate parent-student link', async () => {
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    const klass = await createClass(admin, { name: '5А' })
    const child = await createStudent(admin, { classId: klass.id, name: 'Иванов Иван' })
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: child.id })

    await expect(
      linkParentStudent(admin, { parentUserId: parent.id, studentId: child.id }),
    ).rejects.toMatchObject({
      name: 'ConflictError',
      statusCode: 409,
    })
  })

  it('rejects linking a non-parent user', async () => {
    const teacher = await adminCreateUser(
      admin,
      { email: 't@school.local', password: 'secret1', name: 'Учитель', role: 'teacher' },
      { bitrixEnabled: false },
    )
    const klass = await createClass(admin, { name: '5А' })
    const child = await createStudent(admin, { classId: klass.id, name: 'Иванов Иван' })

    await expect(
      linkParentStudent(admin, { parentUserId: teacher.id, studentId: child.id }),
    ).rejects.toMatchObject({
      name: 'ConflictError',
      statusCode: 409,
    })
  })

  it('unlinks a student from a parent', async () => {
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    const klass = await createClass(admin, { name: '5А' })
    const child = await createStudent(admin, { classId: klass.id, name: 'Иванов Иван' })
    const link = await linkParentStudent(admin, { parentUserId: parent.id, studentId: child.id })

    await unlinkParentStudent(admin, link.id)
    const links = await listParentStudents(admin, parent.id)
    expect(links).toHaveLength(0)
  })
})
