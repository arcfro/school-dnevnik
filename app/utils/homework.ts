export function homeworkDueLabel(dueAt: string | null | undefined) {
  return dueAt || 'без срока'
}

export type HomeworkDueTone = 'overdue' | 'today' | 'soon' | 'later' | 'open'

export function homeworkDueTone(dueAt: string | null | undefined): HomeworkDueTone {
  if (!dueAt) return 'open'
  const due = new Date(`${dueAt}T23:59:59`)
  if (Number.isNaN(due.getTime())) return 'open'
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endToday = new Date(startToday)
  endToday.setDate(endToday.getDate() + 1)
  if (due < startToday) return 'overdue'
  if (due < endToday) return 'today'
  const inThree = new Date(startToday)
  inThree.setDate(inThree.getDate() + 3)
  if (due < inThree) return 'soon'
  return 'later'
}
