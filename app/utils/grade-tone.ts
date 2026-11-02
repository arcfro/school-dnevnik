export type GradeTone = 'excellent' | 'good' | 'mid' | 'low' | 'neutral'

export function gradeTone(value: string | null | undefined): GradeTone {
  if (!value?.trim()) return 'neutral'
  const v = value.trim()
  const n = Number.parseInt(v, 10)
  if (!Number.isNaN(n)) {
    if (n >= 5) return 'excellent'
    if (n === 4) return 'good'
    if (n === 3) return 'mid'
    if (n <= 2) return 'low'
  }
  const lower = v.toLowerCase()
  if (lower === 'зач' || lower === 'зч') return 'good'
  if (lower === 'нз' || lower === 'н/а') return 'low'
  return 'neutral'
}

export function attendanceBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case 'present':
      return 'attendance-badge attendance-badge--present'
    case 'absent':
      return 'attendance-badge attendance-badge--absent'
    case 'late':
      return 'attendance-badge attendance-badge--late'
    case 'excused':
      return 'attendance-badge attendance-badge--excused'
    default:
      return 'attendance-badge attendance-badge--none'
  }
}
