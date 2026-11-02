import { listHomeworkForParent } from '../../services/homework.service'
import { toHttpError } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const studentId = getQuery(event).studentId
  try {
    return await listHomeworkForParent(
      user,
      typeof studentId === 'string' && studentId ? studentId : null,
    )
  } catch (e) {
    throw toHttpError(e)
  }
})
