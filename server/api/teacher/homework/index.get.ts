import { getHomeworkForTeacher } from '../../../services/homework.service'
import { toHttpError } from '../../../utils/http'

function one(value: unknown) {
  return typeof value === 'string' && value ? value : undefined
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await getHomeworkForTeacher(user, one(getQuery(event).classId))
  } catch (e) {
    throw toHttpError(e)
  }
})
