import { listSubjects } from '../../../services/subjects.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await listSubjects(user)
  } catch (e) {
    throw toHttpError(e)
  }
})
