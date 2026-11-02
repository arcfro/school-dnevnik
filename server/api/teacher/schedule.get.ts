import { getScheduleForTeacher } from '../../services/schedule.service'
import { toHttpError } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await getScheduleForTeacher(user)
  } catch (e) {
    throw toHttpError(e)
  }
})
