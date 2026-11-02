import { getClass } from '../../../services/classes.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await getClass(user, getRouterParam(event, 'id') ?? '')
  } catch (e) {
    throw toHttpError(e)
  }
})
