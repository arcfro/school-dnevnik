import { z } from 'zod'
import { authenticateUser } from '../../services/users.service'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const parsed = await readValidatedBody(event, (body) => loginSchema.safeParse(body))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Некорректные данные',
      data: { error: 'validation_error', message: 'Некорректные данные' },
    })
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Неверный email или пароль',
      data: { error: 'unauthorized', message: 'Неверный email или пароль' },
    })
  }

  await setUserSession(event, { user })
  return user
})
