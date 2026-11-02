import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { bitrixLinks, jobs } from '../../server/db/schema'
import { enqueueJob } from '../../server/services/jobs.service'
import { adminCreateUser } from '../../server/services/users.service'
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

describe('job processor', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('processes B24_UPSERT_PARENT via stub client and marks the job done', async () => {
    const { processPendingJobs } = await import('../../server/jobs/processor')
    const { useDb } = await import('../../server/utils/db')

    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: true },
    )

    const result = await processPendingJobs()
    expect(result).toMatchObject({ processed: 1, failed: 0 })

    const rows = await useDb().select().from(jobs)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      type: 'B24_UPSERT_PARENT',
      status: 'done',
      attempts: 1,
      lastError: null,
    })

    const links = await useDb()
      .select()
      .from(bitrixLinks)
      .where(eq(bitrixLinks.localId, parent.id))
    expect(links).toEqual([
      expect.objectContaining({
        localEntity: 'user',
        b24Entity: 'contact',
        b24Id: `stub-contact-${parent.id}`,
        syncState: 'synced',
      }),
    ])
  })

  it('processes B24 lead/deal/task stubs', async () => {
    const { processPendingJobs } = await import('../../server/jobs/processor')
    const { useDb } = await import('../../server/utils/db')
    const localId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

    await enqueueJob('B24_CREATE_LEAD', { localId, title: 'lead' })
    await enqueueJob('B24_CREATE_DEAL', { localId, title: 'deal' })
    await enqueueJob('B24_CREATE_TASK', { localId, title: 'task' })

    const result = await processPendingJobs()
    expect(result.processed).toBe(3)
    expect(result.failed).toBe(0)

    const done = await useDb().select().from(jobs)
    expect(done.every((j) => j.status === 'done')).toBe(true)

    const links = await useDb().select().from(bitrixLinks)
    expect(links.map((l) => l.b24Id).sort()).toEqual([
      `stub-deal-${localId}`,
      `stub-lead-${localId}`,
      `stub-task-${localId}`,
    ])
  })

  it('skips jobs scheduled in the future', async () => {
    const { processPendingJobs } = await import('../../server/jobs/processor')
    const { useDb } = await import('../../server/utils/db')
    const id = await enqueueJob('SEND_PUSH', { userId: 'u1' })
    const later = new Date(Date.now() + 60_000)
    await useDb().update(jobs).set({ runAt: later }).where(eq(jobs.id, id))

    const result = await processPendingJobs({ now: new Date() })
    expect(result.processed).toBe(0)
    const rows = await useDb().select().from(jobs)
    expect(rows[0]?.status).toBe('pending')
  })

  it('marks B24_UPSERT_PARENT failed when the user is missing', async () => {
    const { processPendingJobs } = await import('../../server/jobs/processor')
    const { useDb } = await import('../../server/utils/db')
    await enqueueJob('B24_UPSERT_PARENT', {
      userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    })

    const result = await processPendingJobs()
    expect(result.failed).toBe(1)
    const rows = await useDb().select().from(jobs)
    expect(rows[0]).toMatchObject({
      status: 'failed',
      attempts: 1,
    })
    expect(rows[0]?.lastError).toMatch(/не найден/i)
  })

  it('marks SEND_PUSH done without sending in v1', async () => {
    const { processPendingJobs } = await import('../../server/jobs/processor')
    const { useDb } = await import('../../server/utils/db')
    await enqueueJob('SEND_PUSH', { userId: 'u1', notificationId: 'n1' })

    const result = await processPendingJobs()
    expect(result.processed).toBe(1)
    const rows = await useDb().select().from(jobs)
    expect(rows[0]?.status).toBe('done')
  })

  it('rejects missing or wrong X-Job-Secret', async () => {
    const { assertJobSecret } = await import('../../server/jobs/processor')
    const { ForbiddenError } = await import('../../server/utils/rbac')
    expect(() => assertJobSecret(undefined, 'dev-job-secret')).toThrow(ForbiddenError)
    expect(() => assertJobSecret('nope', 'dev-job-secret')).toThrow(ForbiddenError)
    expect(() => assertJobSecret('dev-job-secret', 'dev-job-secret')).not.toThrow()
  })

  it('lists jobs for admin and rejects teacher', async () => {
    const { listJobs } = await import('../../server/services/jobs.service')
    await enqueueJob('B24_CREATE_LEAD', { localId: 'x' })
    const rows = await listJobs(admin)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      type: 'B24_CREATE_LEAD',
      status: 'pending',
      lastError: null,
    })
    await expect(listJobs(teacher)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })
})
