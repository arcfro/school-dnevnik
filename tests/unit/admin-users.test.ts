import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { jobs } from '../../server/db/schema'
import { adminCreateUser, listUsers } from '../../server/services/users.service'
import type { SessionUser } from '../../server/services/users.service'
import { createTestDb, resetTestDb } from '../helpers/db'

const admin: SessionUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'admin@school.local',
  role: 'admin',
  name: 'Админ',
}

const teacher: SessionUser = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'teacher@school.local',
  role: 'teacher',
  name: 'Учитель',
}

const parentInput = {
  email: 'parent@school.local',
  password: 'secret1',
  name: 'Родитель',
  role: 'parent' as const,
}

describe('adminCreateUser', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('rejects teacher creating a user', async () => {
    await expect(adminCreateUser(teacher, parentInput, { bitrixEnabled: true })).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('enqueues B24_UPSERT_PARENT when creating a parent and bitrixEnabled', async () => {
    const created = await adminCreateUser(admin, parentInput, { bitrixEnabled: true })
    expect(created).toMatchObject({
      email: 'parent@school.local',
      name: 'Родитель',
      role: 'parent',
    })
    expect(created).not.toHaveProperty('passwordHash')

    const { useDb } = await import('../../server/utils/db')
    const rows = await useDb().select().from(jobs)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      type: 'B24_UPSERT_PARENT',
      payload: { userId: created.id },
      status: 'pending',
    })
  })

  it('does not enqueue when bitrixEnabled is false', async () => {
    await adminCreateUser(admin, parentInput, { bitrixEnabled: false })
    const { useDb } = await import('../../server/utils/db')
    const rows = await useDb().select().from(jobs)
    expect(rows).toHaveLength(0)
  })

  it('does not enqueue when creating a teacher', async () => {
    await adminCreateUser(
      admin,
      { ...parentInput, email: 'teacher2@school.local', role: 'teacher', name: 'Учитель 2' },
      { bitrixEnabled: true },
    )
    const { useDb } = await import('../../server/utils/db')
    const rows = await useDb().select().from(jobs)
    expect(rows).toHaveLength(0)
  })

  it('rejects duplicate email', async () => {
    await adminCreateUser(admin, parentInput, { bitrixEnabled: false })
    await expect(adminCreateUser(admin, parentInput, { bitrixEnabled: false })).rejects.toMatchObject({
      name: 'ConflictError',
      statusCode: 409,
    })
  })

  it('lists users without password hashes', async () => {
    await adminCreateUser(admin, parentInput, { bitrixEnabled: false })
    const users = await listUsers(admin)
    expect(users.some((u) => u.email === 'parent@school.local')).toBe(true)
    expect(users.every((u) => !('passwordHash' in u))).toBe(true)
  })
})
