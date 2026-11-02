export function apiErrorMessage(error: unknown, fallback = 'Не удалось сохранить') {
  if (!error || typeof error !== 'object') return fallback
  const e = error as {
    data?: { message?: string; data?: { message?: string } }
    message?: string
    statusMessage?: string
  }
  return e.data?.data?.message || e.data?.message || e.statusMessage || e.message || fallback
}
