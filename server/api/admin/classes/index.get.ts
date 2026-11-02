import { listClasses } from '../../../services/classes.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await listClasses(user)
  } catch (e) {
    throw toHttpError(e)
  }
})
