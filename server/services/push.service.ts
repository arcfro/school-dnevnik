import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { notifications, pushSubscriptions } from '../db/schema'
import { useDb } from '../utils/db'
import { assertRole } from '../utils/rbac'
import type { SessionUser } from './users.service'

const subscriptionSchema = z.object({
  endpoint: z.url('Некорректный endpoint'),
  keys: z.object({
    p256dh: z.string().min(1, 'Укажите p256dh'),
    auth: z.string().min(1, 'Укажите auth'),
  }),
})

const endpointSchema = z.object({
  endpoint: z.url('Некорректный endpoint'),
})

export type PushPayload = {
  title: string
  body: string
  url: string
}

export type PushSubscriptionData = {
  endpoint: string
  p256dh: string
  auth: string
}

export type PushSender = {
  send(subscription: PushSubscriptionData, payload: PushPayload): Promise<void>
}

function payloadText(payload: Record<string, unknown>, key: string) {
  const value = payload[key]
  return typeof value === 'string' && value ? value : ''
}

export function buildPushPayload(type: string, payload: Record<string, unknown>): PushPayload {
  if (type === 'grade') {
    const name = payloadText(payload, 'studentName')
    const subject = payloadText(payload, 'subjectName')
    const value = payloadText(payload, 'value')
    const body = [name, subject && value ? `${subject}: ${value}` : subject || value]
      .filter(Boolean)
      .join(' — ')
    return {
      title: 'Новая оценка',
      body: body || 'Появилась новая оценка',
      url: '/parent/grades',
    }
  }
  if (type === 'homework') {
    return {
      title: 'Новое задание',
      body: payloadText(payload, 'title') || 'Появилось домашнее задание',
      url: '/parent/homework',
    }
  }
  return {
    title: 'Уведомление',
    body: 'Новое уведомление в дневнике',
    url: '/parent/notifications',
  }
}

export async function savePushSubscription(user: SessionUser, input: unknown) {
  assertRole(user, 'parent')
  const data = subscriptionSchema.parse(input)
  const db = useDb()
  const rows = await db
    .insert(pushSubscriptions)
    .values({
      userId: user.id,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: user.id,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      },
    })
    .returning()
  const saved = rows[0]
  if (!saved) throw new Error('Failed to save push subscription')
  return saved
}

export async function deletePushSubscription(user: SessionUser, input: unknown) {
  assertRole(user, 'parent')
  const data = endpointSchema.parse(input)
  const db = useDb()
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, data.endpoint)))
  return { ok: true as const }
}

export async function listPushSubscriptions(userId: string) {
  const db = useDb()
  return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId))
}

export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  const db = useDb()
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
}

export async function loadNotificationPayload(notificationId: string) {
  if (!notificationId) return { type: '', payload: {} as Record<string, unknown> }
  const db = useDb()
  const rows = await db
    .select({
      type: notifications.type,
      payload: notifications.payload,
    })
    .from(notifications)
    .where(eq(notifications.id, notificationId))
    .limit(1)
  const found = rows[0]
  if (!found) return { type: '', payload: {} as Record<string, unknown> }
  const payload =
    found.payload && typeof found.payload === 'object' && !Array.isArray(found.payload)
      ? (found.payload as Record<string, unknown>)
      : {}
  return { type: found.type, payload }
}

export function isPushGoneError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const status = (error as { statusCode?: unknown }).statusCode
  return status === 404 || status === 410
}
