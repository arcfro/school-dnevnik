import { and, eq, lte } from 'drizzle-orm'
import { jobs, users } from '../db/schema'
import { createBitrixClient } from '../integrations/bitrix/client'
import type { BitrixClient } from '../integrations/bitrix/client'
import { useDb } from '../utils/db'
import { ForbiddenError } from '../utils/rbac'
import type { JobType } from './types'

export function assertJobSecret(provided: string | undefined, expected: string) {
  if (!expected || provided !== expected) {
    throw new ForbiddenError('Неверный секрет')
  }
}

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>
  }
  throw new Error('Некорректный payload')
}

async function dispatchJob(type: JobType, payload: Record<string, unknown>, bitrix: BitrixClient) {
  switch (type) {
    case 'B24_UPSERT_PARENT': {
      const userId = String(payload.userId ?? '')
      if (!userId) throw new Error('Пользователь не найден')
      const db = useDb()
      const rows = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      const user = rows[0]
      if (!user) throw new Error('Пользователь не найден')
      await bitrix.upsertParentContact({
        email: user.email,
        name: user.name,
        localUserId: user.id,
      })
      return
    }
    case 'B24_CREATE_LEAD':
      await bitrix.createLead(payload)
      return
    case 'B24_CREATE_DEAL':
      await bitrix.createDeal(payload)
      return
    case 'B24_CREATE_TASK':
      await bitrix.createTask(payload)
      return
    case 'SEND_PUSH':
      return
    default:
      throw new Error(`Неизвестный тип задачи: ${type}`)
  }
}

export async function processPendingJobs(
  options: {
    now?: Date
    bitrixMode?: string
    limit?: number
  } = {},
) {
  const db = useDb()
  const now = options.now ?? new Date()
  const pending = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, 'pending'), lte(jobs.runAt, now)))
    .orderBy(jobs.runAt)
    .limit(options.limit ?? 50)

  const bitrix = createBitrixClient(options.bitrixMode ?? process.env.BITRIX_MODE ?? 'stub')
  const result = { processed: 0, failed: 0, done: [] as string[] }

  for (const job of pending) {
    await db
      .update(jobs)
      .set({
        status: 'processing',
        attempts: job.attempts + 1,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id))

    try {
      await dispatchJob(job.type as JobType, asRecord(job.payload), bitrix)
      await db
        .update(jobs)
        .set({
          status: 'done',
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id))
      result.processed += 1
      result.done.push(job.id)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      await db
        .update(jobs)
        .set({
          status: 'failed',
          lastError: message,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, job.id))
      result.failed += 1
    }
  }

  return result
}
