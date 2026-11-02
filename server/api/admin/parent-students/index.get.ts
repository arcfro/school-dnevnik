import { listParentStudents } from '../../../services/parent-students.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const parentUserId = getQuery(event).parentUserId
  try {
    return await listParentStudents(user, typeof parentUserId === 'string' ? parentUserId : '')
  } catch (e) {
    throw toHttpError(e)
  }
})
