import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import { useDb } from '../utils/db'
import { hashPassword, verifyPassword } from '../utils/password'
import { assertRole } from '../utils/rbac'

export type SessionUser = {
  id: string
  email: string
  role: 'admin' | 'teacher' | 'parent'
  name: string
}

export function toSessionUser(
  row: Pick<typeof users.$inferSelect, 'id' | 'email' | 'role' | 'name'>,
): SessionUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
  }
}

export async function findUserByEmail(email: string) {
  const db = useDb()
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1)
  return rows[0] ?? null
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const row = await findUserByEmail(email)
  if (!row) return null
  const ok = await verifyPassword(password, row.passwordHash)
  if (!ok) return null
  return toSessionUser(row)
}

export async function createUser(input: {
  email: string
  password: string
  name: string
  role: SessionUser['role']
}): Promise<SessionUser> {
  const db = useDb()
  const rows = await db
    .insert(users)
    .values({
      email: input.email.trim().toLowerCase(),
      passwordHash: await hashPassword(input.password),
      name: input.name,
      role: input.role,
    })
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
      name: users.name,
    })
  const created = rows[0]
  if (!created) throw new Error('Failed to create user')
  return toSessionUser(created)
}

export async function listTeachers(user: SessionUser) {
  assertRole(user, 'admin')
  const db = useDb()
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.role, 'teacher'))
    .orderBy(users.name)
}
