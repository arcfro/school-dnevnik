export type RoleNavLink = {
  to: string
  label: string
  exact?: boolean
}

export const adminNav: RoleNavLink[] = [
  { to: '/admin', label: 'Обзор', exact: true },
  { to: '/admin/classes', label: 'Классы' },
  { to: '/admin/students', label: 'Ученики' },
  { to: '/admin/subjects', label: 'Предметы' },
  { to: '/admin/schedule', label: 'Расписание' },
  { to: '/admin/users', label: 'Пользователи' },
  { to: '/admin/jobs', label: 'Задачи' },
]

export const teacherNav: RoleNavLink[] = [
  { to: '/teacher', label: 'Обзор', exact: true },
  { to: '/teacher/journal', label: 'Журнал' },
  { to: '/teacher/homework', label: 'Задания' },
]

export const parentNav: RoleNavLink[] = [
  { to: '/parent', label: 'Обзор', exact: true },
  { to: '/parent/schedule', label: 'Расписание' },
  { to: '/parent/grades', label: 'Оценки' },
  { to: '/parent/homework', label: 'Задания' },
  { to: '/parent/notifications', label: 'Уведомления' },
  { to: '/parent/settings', label: 'Настройки' },
]

export const roleHome = {
  admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
} as const

export const roleLabel = {
  admin: 'Админ',
  teacher: 'Учитель',
  parent: 'Родитель',
} as const
