import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['Pixel 5'] })

async function dismissProductTour(page: import('@playwright/test').Page) {
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close' })
    .click({ timeout: 3_000 })
    .catch(() => {})
  await page.evaluate(() => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('dnevnik:tour:')) keys.push(key)
    }
    for (const key of keys) localStorage.setItem(key, 'done')
  })
}

test('login без горизонтального overflow', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('.login-panel')).toBeVisible()
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  expect(fits).toBe(true)
})

test('admin: гамбургер открывает навигацию без overflow страницы', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('admin@school.local')
  await page.getByLabel('Пароль').fill('admin123')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page).toHaveURL(/\/admin/)
  await dismissProductTour(page)

  const nav = page.locator('#app-nav')
  const menuToggle = page.locator('.nav-toggle')

  await expect(menuToggle).toBeVisible()
  if (await menuToggle.getAttribute('aria-expanded') === 'true') {
    await menuToggle.click()
  }
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('#app-nav a[href="/admin/classes"]')).toBeVisible()

  const layoutOk = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  expect(layoutOk).toBe(true)

  await menuToggle.click()
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
})
