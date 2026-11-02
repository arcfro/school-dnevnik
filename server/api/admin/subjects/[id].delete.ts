import { deleteSubject } from '../../../services/subjects.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await deleteSubject(user, getRouterParam(event, 'id') ?? '')
  } catch (e) {
    throw toHttpError(e)
  }
})
