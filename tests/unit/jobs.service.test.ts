import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { jobs } from '../../server/db/schema'
import { createTestDb, resetTestDb } from '../helpers/db'

describe('enqueueJob', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('inserts a pending job and returns id', async () => {
    const { enqueueJob } = await import('../../server/services/jobs.service')
    const { useDb } = await import('../../server/utils/db')

    const id = await enqueueJob('B24_UPSERT_PARENT', { userId: 'user-1' })

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    const rows = await useDb().select().from(jobs)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id,
      type: 'B24_UPSERT_PARENT',
      payload: { userId: 'user-1' },
      status: 'pending',
    })
  })
})
