import { describe, it, expect } from 'vitest'
import { createClass, listClasses } from '../../server/services/classes.service'
import { createStudent } from '../../server/services/students.service'
import { assignClassSubject } from '../../server/services/subjects.service'
import type { SessionUser } from '../../server/services/users.service'

const teacher: SessionUser = {
  id: 'teacher-1',
  email: 'teacher@school.local',
  role: 'teacher',
  name: 'Учитель',
}

const parent: SessionUser = {
  id: 'parent-1',
  email: 'parent@school.local',
  role: 'parent',
  name: 'Родитель',
}

describe('admin rbac', () => {
  it('rejects teacher calling createClass', async () => {
    await expect(createClass(teacher, { name: '5А' })).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects teacher calling listClasses', async () => {
    await expect(listClasses(teacher)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects teacher calling createStudent', async () => {
    await expect(createStudent(teacher, { classId: 'c1', name: 'Иван' })).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects teacher calling assignClassSubject', async () => {
    await expect(
      assignClassSubject(teacher, {
        classId: 'c1',
        subjectId: 's1',
        teacherUserId: 't1',
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects parent calling createClass', async () => {
    await expect(createClass(parent, { name: '5А' })).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })
})
