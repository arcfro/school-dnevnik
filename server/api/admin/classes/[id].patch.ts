import { updateClass } from '../../../services/classes.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await updateClass(user, getRouterParam(event, 'id') ?? '', await readBody(event))
  } catch (e) {
    throw toHttpError(e)
  }
})
