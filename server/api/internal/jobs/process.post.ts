import { assertJobSecret, processPendingJobs } from '../../../jobs/processor'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  try {
    assertJobSecret(getHeader(event, 'x-job-secret'), String(config.jobSecret ?? ''))
    return await processPendingJobs({
      bitrixMode: String(config.bitrixMode ?? 'stub'),
    })
  } catch (e) {
    throw toHttpError(e)
  }
})
