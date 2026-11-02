export type InAppNotification = {
  id: string
  type: string
  payload: Record<string, unknown>
  readAt: string | Date | null
  createdAt: string | Date
}

function payloadText(payload: Record<string, unknown>, key: string) {
  const value = payload[key]
  return typeof value === 'string' && value ? value : ''
}

export function notificationTitle(item: InAppNotification) {
  const p = item.payload ?? {}
  if (item.type === 'grade') {
    const name = payloadText(p, 'studentName')
    const subject = payloadText(p, 'subjectName')
    const value = payloadText(p, 'value')
    return [name, subject && value ? `${subject}: ${value}` : subject || value]
      .filter(Boolean)
      .join(' — ')
  }
  if (item.type === 'homework') {
    const title = payloadText(p, 'title')
    return title ? `Новое задание: ${title}` : 'Новое задание'
  }
  return 'Уведомление'
}

export function notificationMeta(item: InAppNotification) {
  const p = item.payload ?? {}
  if (item.type === 'grade') {
    return [payloadText(p, 'date'), payloadText(p, 'subjectName')].filter(Boolean).join(' · ')
  }
  if (item.type === 'homework') {
    const due = payloadText(p, 'dueAt')
    return [payloadText(p, 'className'), payloadText(p, 'subjectName'), due ? `до ${due}` : '']
      .filter(Boolean)
      .join(' · ')
  }
  return ''
}

export function notificationHref(item: InAppNotification) {
  if (item.type === 'grade') return '/parent/grades'
  if (item.type === 'homework') return '/parent/homework'
  return '/parent/notifications'
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('ru-RU')
}

export const jobStatusLabel: Record<string, string> = {
  pending: 'В очереди',
  processing: 'В работе',
  done: 'Готово',
  failed: 'Ошибка',
}
