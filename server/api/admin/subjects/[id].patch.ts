import { updateSubject } from '../../../services/subjects.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await updateSubject(user, getRouterParam(event, 'id') ?? '', await readBody(event))
  } catch (e) {
    throw toHttpError(e)
  }
})
