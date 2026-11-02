import { listStudents } from '../../../services/students.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const classId = getQuery(event).classId
  try {
    return await listStudents(user, typeof classId === 'string' ? classId : undefined)
  } catch (e) {
    throw toHttpError(e)
  }
})
