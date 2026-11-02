import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { pushSubscriptions } from '../../server/db/schema'
import { adminCreateUser } from '../../server/services/users.service'
import type { SessionUser } from '../../server/services/users.service'
import { createTestDb, resetTestDb } from '../helpers/db'

const admin: SessionUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'admin@school.local',
  role: 'admin',
  name: 'Админ',
}

const subscriptionBody = {
  endpoint: 'https://push.example/endpoint-1',
  keys: {
    p256dh: 'p256dh-key',
    auth: 'auth-key',
  },
}

describe('push subscriptions', () => {
  beforeEach(() => {
    createTestDb()
  })
  afterEach(() => {
    resetTestDb()
  })

  it('stores a parent push subscription', async () => {
    const { savePushSubscription } = await import('../../server/services/push.service')
    const { useDb } = await import('../../server/utils/db')
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )

    const saved = await savePushSubscription(parent, subscriptionBody)
    expect(saved).toMatchObject({
      userId: parent.id,
      endpoint: subscriptionBody.endpoint,
      p256dh: 'p256dh-key',
      auth: 'auth-key',
    })

    const rows = await useDb().select().from(pushSubscriptions)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: parent.id,
      endpoint: subscriptionBody.endpoint,
    })
  })

  it('upserts the same endpoint onto the current parent', async () => {
    const { savePushSubscription } = await import('../../server/services/push.service')
    const { useDb } = await import('../../server/utils/db')
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    const other = await adminCreateUser(
      admin,
      { email: 'p2@school.local', password: 'secret1', name: 'Другой', role: 'parent' },
      { bitrixEnabled: false },
    )

    await savePushSubscription(other, subscriptionBody)
    await savePushSubscription(parent, {
      ...subscriptionBody,
      keys: { p256dh: 'new-p256dh', auth: 'new-auth' },
    })

    const rows = await useDb()
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscriptionBody.endpoint))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: parent.id,
      p256dh: 'new-p256dh',
      auth: 'new-auth',
    })
  })

  it('rejects teacher subscribe', async () => {
    const { savePushSubscription } = await import('../../server/services/push.service')
    const teacher = await adminCreateUser(
      admin,
      { email: 't@school.local', password: 'secret1', name: 'Учитель', role: 'teacher' },
      { bitrixEnabled: false },
    )
    await expect(savePushSubscription(teacher, subscriptionBody)).rejects.toMatchObject({
      name: 'ForbiddenError',
      statusCode: 403,
    })
  })

  it('rejects invalid subscription payload', async () => {
    const { savePushSubscription } = await import('../../server/services/push.service')
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    await expect(savePushSubscription(parent, { endpoint: 'not-a-url' })).rejects.toMatchObject({
      name: 'ZodError',
    })
  })

  it('deletes own subscription by endpoint and ignores missing', async () => {
    const { savePushSubscription, deletePushSubscription } =
      await import('../../server/services/push.service')
    const { useDb } = await import('../../server/utils/db')
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    await savePushSubscription(parent, subscriptionBody)

    const removed = await deletePushSubscription(parent, { endpoint: subscriptionBody.endpoint })
    expect(removed).toMatchObject({ ok: true })

    const rows = await useDb().select().from(pushSubscriptions)
    expect(rows).toHaveLength(0)

    await expect(
      deletePushSubscription(parent, { endpoint: subscriptionBody.endpoint }),
    ).resolves.toMatchObject({ ok: true })
  })

  it('does not delete another parent subscription', async () => {
    const { savePushSubscription, deletePushSubscription } =
      await import('../../server/services/push.service')
    const { useDb } = await import('../../server/utils/db')
    const parent = await adminCreateUser(
      admin,
      { email: 'p@school.local', password: 'secret1', name: 'Родитель', role: 'parent' },
      { bitrixEnabled: false },
    )
    const other = await adminCreateUser(
      admin,
      { email: 'p2@school.local', password: 'secret1', name: 'Другой', role: 'parent' },
      { bitrixEnabled: false },
    )
    await savePushSubscription(parent, subscriptionBody)

    await deletePushSubscription(other, { endpoint: subscriptionBody.endpoint })
    const rows = await useDb().select().from(pushSubscriptions)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.userId).toBe(parent.id)
  })
})
