import { saveAttendance } from '../../../services/journal.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await saveAttendance(user, await readBody(event))
  } catch (e) {
    throw toHttpError(e)
  }
})
