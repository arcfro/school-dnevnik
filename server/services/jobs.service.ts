import { desc } from 'drizzle-orm'
import { jobs } from '../db/schema'
import type { JobType } from '../jobs/types'
import { useDb } from '../utils/db'
import { assertRole } from '../utils/rbac'
import type { SessionUser } from './users.service'

export type { JobType } from '../jobs/types'

export async function enqueueJob(type: JobType, payload: Record<string, unknown>): Promise<string> {
  const db = useDb()
  const rows = await db
    .insert(jobs)
    .values({ type, payload })
    .returning({ id: jobs.id })
  const created = rows[0]
  if (!created) throw new Error('Failed to enqueue job')
  return created.id
}

export async function listJobs(user: SessionUser) {
  assertRole(user, 'admin')
  const db = useDb()
  return db
    .select({
      id: jobs.id,
      type: jobs.type,
      payload: jobs.payload,
      status: jobs.status,
      attempts: jobs.attempts,
      runAt: jobs.runAt,
      lastError: jobs.lastError,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
}
