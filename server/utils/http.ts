import { createError } from 'h3'
import { ZodError } from 'zod'
import { ConflictError, ForbiddenError, NotFoundError } from './rbac'

export function toHttpError(e: unknown): never {
  if (e instanceof ForbiddenError) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: e.message,
      data: { error: 'forbidden', message: e.message },
    })
  }
  if (e instanceof NotFoundError) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: e.message,
      data: { error: 'not_found', message: e.message },
    })
  }
  if (e instanceof ConflictError) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: e.message,
      data: { error: 'conflict', message: e.message },
    })
  }
  if (e instanceof ZodError) {
    const message = e.issues[0]?.message ?? 'Некорректные данные'
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message,
      data: { error: 'validation_error', message },
    })
  }
  throw e
}
