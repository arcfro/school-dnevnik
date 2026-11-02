import { expect, test } from '@playwright/test'
import {
  DEV_TEACHER_EMAIL,
  DEV_TEACHER_PASSWORD,
} from '../server/db/seed'
import {
  hideDevChrome,
  loginAsTeacher,
  PORTFOLIO_SHOTS_DIR,
  shot,
} from './helpers/teacher-portfolio'

test('portfolio: 7 скриншотов учителя', async ({ page }) => {
  test.setTimeout(90_000)

  await page.goto('/login')
  await page.getByRole('heading', { name: 'Вход' }).waitFor()
  await hideDevChrome(page)
  await page.getByLabel('Email').fill(DEV_TEACHER_EMAIL)
  await page.getByLabel('Пароль').fill(DEV_TEACHER_PASSWORD)
  await shot(page, '01-login.png')

  await loginAsTeacher(page)

  await expect(page.getByRole('heading', { name: 'Расписание' })).toBeVisible()
  await page.locator('[data-tour="teacher-schedule"]').scrollIntoViewIfNeeded()
  await shot(page, '02-schedule.png')

  await page.mouse.wheel(0, 220)
  await expect(page.locator('.schedule-grid').first()).toBeVisible()
  await shot(page, '03-schedule-focus.png')

  await page.goto('/teacher/journal')
  await expect(page.getByRole('heading', { name: 'Журнал' })).toBeVisible()
  const gradeInputs = page.locator('input.journal-grade')
  await expect(gradeInputs.first()).toBeVisible({ timeout: 10_000 })
  const gradeCount = await gradeInputs.count()
  if (gradeCount > 0) await gradeInputs.nth(0).fill('5')
  if (gradeCount > 1) await gradeInputs.nth(1).fill('4')
  if (gradeCount > 2) await gradeInputs.nth(2).fill('5')
  const statusSelect = page.locator('.journal-status').first()
  if (await statusSelect.count()) await statusSelect.selectOption('present')
  await shot(page, '04-journal.png')

  await page.goto('/teacher/homework')
  await expect(page.getByRole('heading', { name: 'Задания' })).toBeVisible()
  await expect(page.locator('.data-table tbody tr').first()).toBeVisible({ timeout: 10_000 })
  await shot(page, '05-homework-list.png')

  await page.goto('/teacher/homework/new')
  await expect(page.getByRole('heading', { name: 'Новое задание' })).toBeVisible()
  await page.getByPlaceholder('Параграф 12').fill('Теорема Пифагора')
  await page.getByPlaceholder('Решить номера 1–5').fill(
    'Найти гипотенузу в прямоугольных треугольниках (задачи 1–3).',
  )
  await shot(page, '06-homework-new.png')

  await page.goto('/teacher/journal')
  await expect(page.getByRole('heading', { name: 'Журнал' })).toBeVisible()
  await page.getByRole('link', { name: 'Журнал' }).waitFor({ state: 'visible' })
  await shot(page, '07-journal-nav.png')
})
