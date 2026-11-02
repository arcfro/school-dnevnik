import { getScheduleForClass } from '../../../services/schedule.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const classId = getQuery(event).classId
  try {
    return await getScheduleForClass(user, typeof classId === 'string' ? classId : '')
  } catch (e) {
    throw toHttpError(e)
  }
})
