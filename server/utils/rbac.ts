export type UserRole = 'admin' | 'teacher' | 'parent'

export class ForbiddenError extends Error {
  readonly statusCode = 403
  constructor(message = 'Недостаточно прав') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404
  constructor(message = 'Не найдено') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409
  constructor(message = 'Конфликт') {
    super(message)
    this.name = 'ConflictError'
  }
}

export function assertRole(
  user: { role: UserRole } | null | undefined,
  role: UserRole | UserRole[],
) {
  const allowed = Array.isArray(role) ? role : [role]
  if (!user || !allowed.includes(user.role)) {
    throw new ForbiddenError()
  }
}
