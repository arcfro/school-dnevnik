import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { bitrixLinks } from '../../server/db/schema'
import { createTestDb, resetTestDb } from '../helpers/db'

describe('StubBitrixClient', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('upsertParentContact returns stub id and inserts bitrix_links', async () => {
    const { createBitrixClient } = await import('../../server/integrations/bitrix/client')
    const { useDb } = await import('../../server/utils/db')

    const client = createBitrixClient('stub')
    const localUserId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    const result = await client.upsertParentContact({
      email: 'parent@school.local',
      name: 'Родитель',
      localUserId,
    })

    expect(result).toEqual({ b24Id: `stub-contact-${localUserId}` })
    const rows = await useDb()
      .select()
      .from(bitrixLinks)
      .where(eq(bitrixLinks.localId, localUserId))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      localEntity: 'user',
      localId: localUserId,
      b24Entity: 'contact',
      b24Id: `stub-contact-${localUserId}`,
      syncState: 'synced',
    })
  })
})
