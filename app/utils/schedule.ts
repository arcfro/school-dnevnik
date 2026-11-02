export const WEEKDAYS = [
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
] as const

export const LESSON_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8] as const

export type ScheduleSlot = {
  id: string
  classId: string
  className: string
  dayOfWeek: number
  lessonIndex: number
  subjectId: string
  subjectName: string
  teacherUserId: string
  teacherName: string
  room: string | null
}

export function scheduleCellKey(dayOfWeek: number, lessonIndex: number) {
  return `${dayOfWeek}:${lessonIndex}`
}

export function slotsByCell(slots: ScheduleSlot[] | null | undefined) {
  const map = new Map<string, ScheduleSlot>()
  for (const slot of slots ?? []) {
    map.set(scheduleCellKey(slot.dayOfWeek, slot.lessonIndex), slot)
  }
  return map
}
