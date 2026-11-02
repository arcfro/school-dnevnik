import { expect, test } from '@playwright/test'
import {
  DEV_TEACHER_EMAIL,
  DEV_TEACHER_PASSWORD,
} from '../server/db/seed'
import {
  dismissProductTour,
  hideDevChrome,
  markTourDone,
} from './helpers/teacher-portfolio'

const REEL_MS = 45_000

test('portfolio: учитель 45с', async ({ page }) => {
  test.setTimeout(120_000)

  const t0 = Date.now()
  const until = async (markMs: number) => {
    const wait = t0 + markMs - Date.now()
    if (wait > 0) await page.waitForTimeout(wait)
  }

  await page.goto('/login')
  await page.getByRole('heading', { name: 'Вход' }).waitFor()
  await hideDevChrome(page)
  await page.getByLabel('Email').fill(DEV_TEACHER_EMAIL)
  await page.getByLabel('Пароль').fill(DEV_TEACHER_PASSWORD)
  await until(3_500)

  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('heading', { name: 'Расписание' })).toBeVisible({ timeout: 30_000 })
  await markTourDone(page)
  await dismissProductTour(page)
  await until(9_000)

  await expect(page.getByRole('heading', { name: 'Расписание' })).toBeVisible()
  await page.locator('[data-tour="teacher-schedule"]').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 220)
  await until(14_000)

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
  await until(24_000)

  await page.goto('/teacher/homework')
  await expect(page.getByRole('heading', { name: 'Задания' })).toBeVisible()
  await expect(page.locator('.data-table tbody tr').first()).toBeVisible({ timeout: 10_000 })
  await until(30_000)

  await page.goto('/teacher/homework/new')
  await expect(page.getByRole('heading', { name: 'Новое задание' })).toBeVisible()
  await page.getByPlaceholder('Параграф 12').fill('Теорема Пифагора')
  await page.getByPlaceholder('Решить номера 1–5').fill(
    'Найти гипотенузу в прямоугольных треугольниках (задачи 1–3).',
  )
  await until(38_000)

  await page.goto('/teacher/homework')
  await expect(page.getByRole('heading', { name: 'Задания' })).toBeVisible()
  await until(42_000)

  await page.goto('/teacher')
  await expect(page.getByRole('heading', { name: 'Расписание' })).toBeVisible()
  await page.locator('.schedule-grid').first().hover()
  await until(REEL_MS)
})
