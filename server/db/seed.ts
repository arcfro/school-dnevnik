import { eq } from 'drizzle-orm'
import { classes } from './schema'
import { createClass } from '../services/classes.service'
import { createHomework } from '../services/homework.service'
import { createStudent } from '../services/students.service'
import { upsertSlot } from '../services/schedule.service'
import { assignClassSubject, createSubject } from '../services/subjects.service'
import {
  createUser,
  findUserByEmail,
  toSessionUser,
} from '../services/users.service'
import { useDb } from '../utils/db'

export const DEV_ADMIN_EMAIL = 'admin@school.local'
export const DEV_ADMIN_PASSWORD = 'admin123'
export const DEV_TEACHER_EMAIL = 'teacher@school.local'
export const DEV_TEACHER_PASSWORD = 'teacher123'

export const DEV_DEMO_CLASS_NAME = '5А'

function dueInDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function seedDevAdmin() {
  const existing = await findUserByEmail(DEV_ADMIN_EMAIL)
  if (!existing) {
    await createUser({
      email: DEV_ADMIN_EMAIL,
      password: DEV_ADMIN_PASSWORD,
      name: 'Администратор',
      role: 'admin',
    })
  }
  await seedDevTeacher()
  await seedDevTeacherDemo()
}

async function seedDevTeacher() {
  const existing = await findUserByEmail(DEV_TEACHER_EMAIL)
  if (existing) return existing
  return createUser({
    email: DEV_TEACHER_EMAIL,
    password: DEV_TEACHER_PASSWORD,
    name: 'Учитель',
    role: 'teacher',
  })
}

/** Класс, ученики, расписание и ДЗ для демо / portfolio video (идемпотентно). */
export async function seedDevTeacherDemo() {
  const adminRow = await findUserByEmail(DEV_ADMIN_EMAIL)
  const teacherRow = await findUserByEmail(DEV_TEACHER_EMAIL)
  if (!adminRow || !teacherRow) return

  const db = useDb()
  const existingClass = await db
    .select({ id: classes.id })
    .from(classes)
    .where(eq(classes.name, DEV_DEMO_CLASS_NAME))
    .limit(1)
  if (existingClass[0]) return

  const admin = toSessionUser(adminRow)
  const teacher = toSessionUser(teacherRow)

  const klass = await createClass(admin, { name: DEV_DEMO_CLASS_NAME, gradeLevel: '5' })
  const math = await createSubject(admin, { name: 'Математика' })
  const russian = await createSubject(admin, { name: 'Русский язык' })

  await assignClassSubject(admin, {
    classId: klass.id,
    subjectId: math.id,
    teacherUserId: teacher.id,
  })
  await assignClassSubject(admin, {
    classId: klass.id,
    subjectId: russian.id,
    teacherUserId: teacher.id,
  })

  for (const name of [
    'Иванов Иван',
    'Петрова Анна',
    'Сидоров Пётр',
    'Козлова Мария',
    'Новиков Алексей',
  ]) {
    await createStudent(admin, { classId: klass.id, name })
  }

  await upsertSlot(admin, {
    classId: klass.id,
    dayOfWeek: 1,
    lessonIndex: 1,
    subjectId: math.id,
    teacherUserId: teacher.id,
    room: '204',
  })
  await upsertSlot(admin, {
    classId: klass.id,
    dayOfWeek: 1,
    lessonIndex: 3,
    subjectId: math.id,
    teacherUserId: teacher.id,
    room: '204',
  })
  await upsertSlot(admin, {
    classId: klass.id,
    dayOfWeek: 3,
    lessonIndex: 2,
    subjectId: russian.id,
    teacherUserId: teacher.id,
    room: '118',
  })
  await upsertSlot(admin, {
    classId: klass.id,
    dayOfWeek: 5,
    lessonIndex: 4,
    subjectId: math.id,
    teacherUserId: teacher.id,
    room: '204',
  })

  await createHomework(teacher, {
    classId: klass.id,
    subjectId: math.id,
    title: '§12–14: квадратные уравнения',
    body: 'Повторить формулы, решить задачи 401–405 из учебника.',
    dueAt: dueInDays(3),
  })
}
