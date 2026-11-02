import { assertJobSecret, processPendingJobs } from '../../../jobs/processor'
import { createWebPushSender } from '../../../jobs/web-push'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  try {
    assertJobSecret(getHeader(event, 'x-job-secret'), String(config.jobSecret ?? ''))
    return await processPendingJobs({
      bitrixMode: String(config.bitrixMode ?? 'stub'),
      sendPush: createWebPushSender({
        publicKey: String(config.vapidPublicKey ?? ''),
        privateKey: String(config.vapidPrivateKey ?? ''),
        subject: String(config.vapidSubject ?? 'mailto:admin@school.local'),
      }),
    })
  } catch (e) {
    throw toHttpError(e)
  }
})
