export type RoleNavLink = {
  to: string
  label: string
  icon?: string
  exact?: boolean
  badge?: number
}

export const adminNav: RoleNavLink[] = [
  { to: '/admin', label: 'Обзор', icon: 'lucide:layout-dashboard', exact: true },
  { to: '/admin/classes', label: 'Классы', icon: 'lucide:school' },
  { to: '/admin/students', label: 'Ученики', icon: 'lucide:users' },
  { to: '/admin/subjects', label: 'Предметы', icon: 'lucide:book-open' },
  { to: '/admin/schedule', label: 'Расписание', icon: 'lucide:calendar-days' },
  { to: '/admin/users', label: 'Пользователи', icon: 'lucide:user-cog' },
  { to: '/admin/jobs', label: 'Задачи', icon: 'lucide:workflow' },
]

export const teacherNav: RoleNavLink[] = [
  { to: '/teacher', label: 'Обзор', icon: 'lucide:calendar-days', exact: true },
  { to: '/teacher/journal', label: 'Журнал', icon: 'lucide:notebook-pen' },
  { to: '/teacher/homework', label: 'Задания', icon: 'lucide:clipboard-list' },
]

export const parentNav: RoleNavLink[] = [
  { to: '/parent', label: 'Обзор', icon: 'lucide:home', exact: true },
  { to: '/parent/schedule', label: 'Расписание', icon: 'lucide:calendar-days' },
  { to: '/parent/grades', label: 'Оценки', icon: 'lucide:star' },
  { to: '/parent/homework', label: 'Задания', icon: 'lucide:book-marked' },
  { to: '/parent/notifications', label: 'Уведомления', icon: 'lucide:bell' },
  { to: '/parent/settings', label: 'Настройки', icon: 'lucide:settings' },
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
