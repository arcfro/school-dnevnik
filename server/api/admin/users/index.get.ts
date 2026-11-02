import { listUsers } from '../../../services/users.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await listUsers(user)
  } catch (e) {
    throw toHttpError(e)
  }
})
