import { createUser, findUserByEmail } from '../services/users.service'

export const DEV_ADMIN_EMAIL = 'admin@school.local'
export const DEV_ADMIN_PASSWORD = 'admin123'

export async function seedDevAdmin() {
  const existing = await findUserByEmail(DEV_ADMIN_EMAIL)
  if (existing) return existing
  return createUser({
    email: DEV_ADMIN_EMAIL,
    password: DEV_ADMIN_PASSWORD,
    name: 'Администратор',
    role: 'admin',
  })
}
