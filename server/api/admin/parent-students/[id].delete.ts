import { unlinkParentStudent } from '../../../services/parent-students.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await unlinkParentStudent(user, getRouterParam(event, 'id') ?? '')
  } catch (e) {
    throw toHttpError(e)
  }
})
