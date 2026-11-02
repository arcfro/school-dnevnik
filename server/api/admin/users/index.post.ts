import { adminCreateUser } from '../../../services/users.service'
import { toHttpError } from '../../../utils/http'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const config = useRuntimeConfig()
  try {
    return await adminCreateUser(user, await readBody(event), {
      bitrixEnabled: Boolean(config.bitrixEnabled),
    })
  } catch (e) {
    throw toHttpError(e)
  }
})
