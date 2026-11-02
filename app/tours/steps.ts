import type { TourRole } from '~/utils/tour-storage'

export type TourStepDef = {
  element: string
  title: string
  description: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

const parentSteps: TourStepDef[] = [
  {
    element: '[data-tour="app-brand"]',
    title: 'Дневник',
    description: 'Краткий тур по приложению для родителей. Можно пропустить в любой момент.',
    side: 'bottom',
  },
  {
    element: '[data-tour="app-nav"]',
    title: 'Разделы',
    description: 'Здесь расписание, оценки и домашние задания ребёнка. Всё только для чтения.',
    side: 'bottom',
  },
  {
    element: '[data-tour="nav-parent-grades"]',
    title: 'Оценки',
    description: 'Последние оценки по предметам. Если детей несколько — переключатель будет на странице.',
    side: 'bottom',
  },
  {
    element: '[data-tour="nav-parent-notifications"]',
    title: 'Уведомления',
    description: 'Новые оценки и задания появляются здесь. Счётчик — непрочитанные.',
    side: 'bottom',
  },
  {
    element: '[data-tour="nav-parent-settings"]',
    title: 'Push-уведомления',
    description: 'В настройках включите уведомления на телефон. На iPhone сначала «На экран Домой».',
    side: 'bottom',
  },
]

const teacherSteps: TourStepDef[] = [
  {
    element: '[data-tour="app-brand"]',
    title: 'Дневник',
    description: 'Тур для учителя: журнал, задания и ваше расписание.',
    side: 'bottom',
  },
  {
    element: '[data-tour="teacher-schedule"]',
    title: 'Расписание',
    description: 'Уроки на неделю по вашим классам. Отсюда удобно начинать день.',
    side: 'top',
  },
  {
    element: '[data-tour="nav-teacher-journal"]',
    title: 'Журнал',
    description: 'Оценки и посещаемость: выберите класс, предмет и дату, сохраните таблицу.',
    side: 'bottom',
  },
  {
    element: '[data-tour="nav-teacher-homework"]',
    title: 'Задания',
    description: 'Выдайте ДЗ — родители получат уведомление (если включили push).',
    side: 'bottom',
  },
]

const adminSteps: TourStepDef[] = [
  {
    element: '[data-tour="app-brand"]',
    title: 'Дневник',
    description: 'Тур для администратора: настройка школы перед началом года.',
    side: 'bottom',
  },
  {
    element: '[data-tour="nav-admin-classes"]',
    title: 'Классы и ученики',
    description: 'Создайте классы и добавьте учеников в карточке класса.',
    side: 'bottom',
  },
  {
    element: '[data-tour="nav-admin-subjects"]',
    title: 'Предметы',
    description: 'Список предметов, затем привязка к классу и учителю.',
    side: 'bottom',
  },
  {
    element: '[data-tour="nav-admin-schedule"]',
    title: 'Расписание',
    description: 'Сетка уроков для каждого класса.',
    side: 'bottom',
  },
  {
    element: '[data-tour="nav-admin-users"]',
    title: 'Пользователи',
    description: 'Учителя и родители. Привяжите родителя к ребёнку на карточке пользователя.',
    side: 'bottom',
  },
]

export function stepsForRole(role: TourRole): TourStepDef[] {
  switch (role) {
    case 'parent':
      return parentSteps
    case 'teacher':
      return teacherSteps
    case 'admin':
      return adminSteps
  }
}
