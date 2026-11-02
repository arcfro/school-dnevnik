export const ATTENDANCE_STATUSES = [
  { value: '', label: '—' },
  { value: 'present', label: 'Был' },
  { value: 'absent', label: 'Н' },
  { value: 'late', label: 'Оп' },
  { value: 'excused', label: 'Ув' },
] as const

export type AttendanceStatus = Exclude<(typeof ATTENDANCE_STATUSES)[number]['value'], ''>

export function attendanceLabel(status: string | null | undefined) {
  return ATTENDANCE_STATUSES.find((s) => s.value === status)?.label ?? '—'
}

export function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
