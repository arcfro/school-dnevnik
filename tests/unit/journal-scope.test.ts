import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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

async function seedJournal() {
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
  const classmate = await createStudent(admin, { classId: klass.id, name: 'Петрова Анна' })
  const stranger = await createStudent(admin, { classId: otherClass.id, name: 'Чужой' })
  return { teacher, other, klass, otherClass, math, physics, student, classmate, stranger }
}

describe('journal scope', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('rejects teacher writing grades for unassigned class/subject', async () => {
    const { saveGrades } = await import('../../server/services/journal.service')
    const { teacher, otherClass, math, stranger } = await seedJournal()

    await expect(
      saveGrades(teacher, {
        classId: otherClass.id,
        subjectId: math.id,
        date: isoDate(),
        entries: [{ studentId: stranger.id, value: '5' }],
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects teacher writing attendance for another teacher subject', async () => {
    const { saveAttendance } = await import('../../server/services/journal.service')
    const { teacher, klass, physics, student } = await seedJournal()

    await expect(
      saveAttendance(teacher, {
        classId: klass.id,
        subjectId: physics.id,
        date: isoDate(),
        entries: [{ studentId: student.id, status: 'absent' }],
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects parent saving grades', async () => {
    const { saveGrades } = await import('../../server/services/journal.service')
    await expect(
      saveGrades(parentActor, {
        classId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        subjectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        date: isoDate(),
        entries: [],
      }),
    ).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('saves grades and attendance for assigned class/subject', async () => {
    const { getJournalForTeacher, saveAttendance, saveGrades } =
      await import('../../server/services/journal.service')
    const { teacher, klass, math, student, classmate } = await seedJournal()
    const date = isoDate()

    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
      entries: [
        { studentId: student.id, value: '5' },
        { studentId: classmate.id, value: '4', comment: 'самостоятельная' },
      ],
    })
    await saveAttendance(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
      entries: [
        { studentId: student.id, status: 'present' },
        { studentId: classmate.id, status: 'absent' },
      ],
    })

    const journal = await getJournalForTeacher(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
    })
    expect(journal.className).toBe('5А')
    expect(journal.subjectName).toBe('Математика')
    expect(journal.students.map((s) => s.name)).toEqual(['Иванов Иван', 'Петрова Анна'])
    expect(journal.students[0]).toMatchObject({
      id: student.id,
      grade: { value: '5' },
      attendance: { status: 'present' },
    })
    expect(journal.students[1]).toMatchObject({
      id: classmate.id,
      grade: { value: '4', comment: 'самостоятельная' },
      attendance: { status: 'absent' },
    })
  })

  it('upserts the same student/subject/date grade in place', async () => {
    const { getJournalForTeacher, saveGrades } = await import('../../server/services/journal.service')
    const { teacher, klass, math, student } = await seedJournal()
    const date = isoDate()

    const first = await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
      entries: [{ studentId: student.id, value: '3' }],
    })
    const second = await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
      entries: [{ studentId: student.id, value: '5' }],
    })
    expect(second[0]?.id).toBe(first[0]?.id)

    const journal = await getJournalForTeacher(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
    })
    expect(journal.students[0]?.grade).toMatchObject({ id: first[0]?.id, value: '5' })
  })

  it('clears grade and attendance when value/status empty', async () => {
    const { getJournalForTeacher, saveAttendance, saveGrades } =
      await import('../../server/services/journal.service')
    const { teacher, klass, math, student } = await seedJournal()
    const date = isoDate()

    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
      entries: [{ studentId: student.id, value: '4' }],
    })
    await saveAttendance(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
      entries: [{ studentId: student.id, status: 'late' }],
    })
    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
      entries: [{ studentId: student.id, value: '' }],
    })
    await saveAttendance(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
      entries: [{ studentId: student.id, status: '' }],
    })

    const journal = await getJournalForTeacher(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date,
    })
    expect(journal.students[0]?.grade).toBeNull()
    expect(journal.students[0]?.attendance).toBeNull()
  })

  it('rejects grades for a student from another class', async () => {
    const { saveGrades } = await import('../../server/services/journal.service')
    const { teacher, klass, math, stranger } = await seedJournal()

    await expect(
      saveGrades(teacher, {
        classId: klass.id,
        subjectId: math.id,
        date: isoDate(),
        entries: [{ studentId: stranger.id, value: '5' }],
      }),
    ).rejects.toMatchObject({
      name: 'ConflictError',
      statusCode: 409,
    })
  })

  it('rejects parent reading another student grades', async () => {
    const { getGradesForParent } = await import('../../server/services/journal.service')
    const { student, stranger } = await seedJournal()
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: student.id })

    await expect(getGradesForParent(parent, stranger.id)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('returns linked student grades for last 30 days only', async () => {
    const { getGradesForParent, saveAttendance, saveGrades } =
      await import('../../server/services/journal.service')
    const { teacher, klass, math, student } = await seedJournal()
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    await linkParentStudent(admin, { parentUserId: parent.id, studentId: student.id })

    const today = isoDate()
    const recent = isoDate(-10)
    const old = isoDate(-31)

    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: today,
      entries: [{ studentId: student.id, value: '5' }],
    })
    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: recent,
      entries: [{ studentId: student.id, value: '4' }],
    })
    await saveGrades(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: old,
      entries: [{ studentId: student.id, value: '2' }],
    })
    await saveAttendance(teacher, {
      classId: klass.id,
      subjectId: math.id,
      date: today,
      entries: [{ studentId: student.id, status: 'present' }],
    })

    const view = await getGradesForParent(parent, student.id)
    expect(view.studentId).toBe(student.id)
    expect(view.grades.map((g) => g.value).sort()).toEqual(['4', '5'])
    expect(view.grades.some((g) => g.value === '2')).toBe(false)
    expect(view.attendance).toEqual([
      expect.objectContaining({ date: today, status: 'present', subjectName: 'Математика' }),
    ])
  })
})
