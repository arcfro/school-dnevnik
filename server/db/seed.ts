import { createUser, findUserByEmail } from '../services/users.service'

export const DEV_ADMIN_EMAIL = 'admin@school.local'
export const DEV_ADMIN_PASSWORD = 'admin123'
export const DEV_TEACHER_EMAIL = 'teacher@school.local'
export const DEV_TEACHER_PASSWORD = 'teacher123'

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
