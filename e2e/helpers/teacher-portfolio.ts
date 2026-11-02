import type { Page } from '@playwright/test'
import {
  DEV_TEACHER_EMAIL,
  DEV_TEACHER_PASSWORD,
} from '../../server/db/seed'

export const PORTFOLIO_SHOTS_DIR = 'videos/portfolio-screenshots'

export async function hideDevChrome(page: Page) {
  await page
    .addStyleTag({
      content: `
        .nuxt-devtools-trigger,
        .nuxt-devtools,
        [data-nuxt-devtools],
        button[title*="DevTools"],
        button[aria-label*="DevTools"] {
          display: none !important;
        }
      `,
    })
    .catch(() => {})
}

export async function markTourDone(page: Page) {
  await page.evaluate(async () => {
    const res = await fetch('/api/auth/me')
    if (!res.ok) return
    const user = (await res.json()) as { id: string; role: string }
    localStorage.setItem(`dnevnik:tour:v1:${user.role}:${user.id}`, 'done')
  })
}

export async function dismissProductTour(page: Page) {
  await page.keyboard.press('Escape')
  await page
    .locator('.driver-popover, .driver-overlay')
    .first()
    .waitFor({ state: 'hidden', timeout: 2_000 })
    .catch(() => {})
}

export async function loginAsTeacher(page: Page) {
  await page.goto('/login')
  await page.getByRole('heading', { name: 'Вход' }).waitFor()
  await page.getByLabel('Email').fill(DEV_TEACHER_EMAIL)
  await page.getByLabel('Пароль').fill(DEV_TEACHER_PASSWORD)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.getByRole('heading', { name: 'Расписание' }).waitFor({ timeout: 30_000 })
  await markTourDone(page)
  await dismissProductTour(page)
  await hideDevChrome(page)
}

export async function shot(page: Page, fileName: string) {
  await page.screenshot({
    path: `${PORTFOLIO_SHOTS_DIR}/${fileName}`,
    type: 'png',
    animations: 'disabled',
    fullPage: false,
  })
}
