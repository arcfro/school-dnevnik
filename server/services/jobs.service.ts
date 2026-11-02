import { jobs } from '../db/schema'
import { useDb } from '../utils/db'

export type JobType =
  | 'B24_UPSERT_PARENT'
  | 'B24_CREATE_LEAD'
  | 'B24_CREATE_DEAL'
  | 'B24_CREATE_TASK'
  | 'SEND_PUSH'

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
