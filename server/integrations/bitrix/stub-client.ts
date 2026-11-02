import { bitrixLinks } from '../../db/schema'
import { useDb } from '../../utils/db'
import type { BitrixClient } from './client'

export class StubBitrixClient implements BitrixClient {
  async upsertParentContact(payload: { email: string; name: string; localUserId: string }) {
    const b24Id = `stub-contact-${payload.localUserId}`
    await insertLink({
      localEntity: 'user',
      localId: payload.localUserId,
      b24Entity: 'contact',
      b24Id,
    })
    return { b24Id }
  }

  async createLead(payload: Record<string, unknown>) {
    return stubEntity('lead', payload)
  }

  async createDeal(payload: Record<string, unknown>) {
    return stubEntity('deal', payload)
  }

  async createTask(payload: Record<string, unknown>) {
    return stubEntity('task', payload)
  }
}

async function stubEntity(kind: 'lead' | 'deal' | 'task', payload: Record<string, unknown>) {
  const localId = String(payload.localId ?? crypto.randomUUID())
  const b24Id = `stub-${kind}-${localId}`
  await insertLink({
    localEntity: kind,
    localId,
    b24Entity: kind,
    b24Id,
  })
  return { b24Id }
}

async function insertLink(input: {
  localEntity: string
  localId: string
  b24Entity: string
  b24Id: string
}) {
  const db = useDb()
  await db.insert(bitrixLinks).values({
    ...input,
    syncState: 'synced',
  })
}
