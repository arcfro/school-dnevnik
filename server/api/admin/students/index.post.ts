import { createStudent } from '../../../services/students.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await createStudent(user, await readBody(event))
  } catch (e) {
    throw toHttpError(e)
  }
})
