import { listJobs } from '../../services/jobs.service'
import { toHttpError } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await listJobs(user)
  } catch (e) {
    throw toHttpError(e)
  }
})
