import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../db/schema'
import { useDb } from '../utils/db'
import { hashPassword, verifyPassword } from '../utils/password'
import { assertRole, ConflictError, NotFoundError } from '../utils/rbac'
import { enqueueJob } from './jobs.service'

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

const idSchema = z.uuid('Некорректный id')

const createUserSchema = z.object({
  email: z.email('Некорректный email').trim().toLowerCase(),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().trim().min(1, 'Укажите имя'),
  role: z.enum(['admin', 'teacher', 'parent']),
})

const userPublicFields = {
  id: users.id,
  email: users.email,
  role: users.role,
  name: users.name,
  createdAt: users.createdAt,
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

export async function listUsers(user: SessionUser) {
  assertRole(user, 'admin')
  const db = useDb()
  return db.select(userPublicFields).from(users).orderBy(users.role, users.name)
}

export async function getUser(user: SessionUser, id: string) {
  assertRole(user, 'admin')
  const userId = idSchema.parse(id)
  const db = useDb()
  const rows = await db.select(userPublicFields).from(users).where(eq(users.id, userId)).limit(1)
  const found = rows[0]
  if (!found) throw new NotFoundError('Пользователь не найден')
  return found
}

export async function adminCreateUser(
  actor: SessionUser,
  input: unknown,
  options: { bitrixEnabled: boolean },
) {
  assertRole(actor, 'admin')
  const data = createUserSchema.parse(input)
  const existing = await findUserByEmail(data.email)
  if (existing) throw new ConflictError('Пользователь с таким email уже есть')
  const created = await createUser(data)
  if (created.role === 'parent' && options.bitrixEnabled) {
    await enqueueJob('B24_UPSERT_PARENT', { userId: created.id })
  }
  return created
}
