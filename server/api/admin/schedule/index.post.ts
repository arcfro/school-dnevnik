import { upsertSlot } from '../../../services/schedule.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  try {
    return await upsertSlot(user, await readBody(event))
  } catch (e) {
    throw toHttpError(e)
  }
})
