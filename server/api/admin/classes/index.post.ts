import { createClass } from '../../../services/classes.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await createClass(user, await readBody(event))
  } catch (e) {
    throw toHttpError(e)
  }
})
