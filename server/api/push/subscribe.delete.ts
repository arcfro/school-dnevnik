import { deletePushSubscription } from '../../services/push.service'
import { toHttpError } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await deletePushSubscription(user, await readBody(event))
  } catch (e) {
    throw toHttpError(e)
  }
})
