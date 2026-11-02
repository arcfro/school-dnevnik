import { createHomework } from '../../../services/homework.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await createHomework(user, await readBody(event))
  } catch (e) {
    throw toHttpError(e)
  }
})
