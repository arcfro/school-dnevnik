import { listNotifications } from '../../../services/notifications.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await listNotifications(user)
  } catch (e) {
    throw toHttpError(e)
  }
})
