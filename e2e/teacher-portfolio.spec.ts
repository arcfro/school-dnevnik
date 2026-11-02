import { expect, test } from '@playwright/test'
import {
  DEV_TEACHER_EMAIL,
  DEV_TEACHER_PASSWORD,
} from '../server/db/seed'

const REEL_MS = 30_000

async function dismissProductTour(page: import('@playwright/test').Page) {
  await page.keyboard.press('Escape')
  await page
    .locator('.driver-popover, .driver-overlay')
    .first()
    .waitFor({ state: 'hidden', timeout: 2_000 })
    .catch(() => {})
}

async function markTourDone(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const res = await fetch('/api/auth/me')
    if (!res.ok) return
    const user = (await res.json()) as { id: string; role: string }
    localStorage.setItem(`dnevnik:tour:v1:${user.role}:${user.id}`, 'done')
  })
}

test('portfolio: учитель 30с', async ({ page }) => {
  test.setTimeout(90_000)

  const t0 = Date.now()
  const until = async (markMs: number) => {
    const wait = t0 + markMs - Date.now()
    if (wait > 0) await page.waitForTimeout(wait)
  }

  await page.goto('/login')
  await page.getByRole('heading', { name: 'Вход' }).waitFor()
  await page.getByLabel('Email').fill(DEV_TEACHER_EMAIL)
  await page.getByLabel('Пароль').fill(DEV_TEACHER_PASSWORD)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('heading', { name: 'Расписание' })).toBeVisible({ timeout: 30_000 })
  await markTourDone(page)
  await dismissProductTour(page)
  await until(2_000)

  await expect(page.getByRole('heading', { name: 'Расписание' })).toBeVisible()
  await page.locator('[data-tour="teacher-schedule"]').scrollIntoViewIfNeeded()
  await page.mouse.wheel(0, 160)
  await until(7_500)

  await page.goto('/teacher/journal')
  await expect(page.getByRole('heading', { name: 'Журнал' })).toBeVisible()
  const gradeInputs = page.locator('input.journal-grade')
  await expect(gradeInputs.first()).toBeVisible({ timeout: 10_000 })
  const gradeCount = await gradeInputs.count()
  if (gradeCount > 0) await gradeInputs.nth(0).fill('5')
  if (gradeCount > 1) await gradeInputs.nth(1).fill('4')
  const statusSelect = page.locator('.journal-status').first()
  if (await statusSelect.count()) await statusSelect.selectOption('present')
  await until(14_000)

  await page.goto('/teacher/homework')
  await expect(page.getByRole('heading', { name: 'Задания' })).toBeVisible()
  await until(17_000)

  await page.goto('/teacher/homework/new')
  await expect(page.getByRole('heading', { name: 'Новое задание' })).toBeVisible()
  await page.getByPlaceholder('Параграф 12').fill('Демо: теорема Пифагора')
  await page.getByPlaceholder('Решить номера 1–5').fill(
    'Найти гипотенузу (задачи 1–3).',
  )
  await until(23_000)

  await page.goto('/teacher/homework')
  await expect(page.getByRole('heading', { name: 'Задания' })).toBeVisible()
  await until(26_000)

  await page.goto('/teacher')
  await expect(page.getByRole('heading', { name: 'Расписание' })).toBeVisible()
  await page.locator('.schedule-grid').hover()
  await until(REEL_MS)
})
