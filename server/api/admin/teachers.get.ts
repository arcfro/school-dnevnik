import { listTeachers } from '../../services/users.service'
import { toHttpError } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await listTeachers(user)
  } catch (e) {
    throw toHttpError(e)
  }
})
