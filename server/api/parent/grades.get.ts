import { getGradesForParent } from '../../services/journal.service'
import { toHttpError } from '../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const studentId = getQuery(event).studentId
  try {
    return await getGradesForParent(
      user,
      typeof studentId === 'string' && studentId ? studentId : null,
    )
  } catch (e) {
    throw toHttpError(e)
  }
})
