import { markNotificationRead } from '../../../services/notifications.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await markNotificationRead(user, getRouterParam(event, 'id') ?? '')
  } catch (e) {
    throw toHttpError(e)
  }
})
