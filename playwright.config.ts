import { defineConfig, devices } from '@playwright/test'
import { PORTFOLIO_VIEWPORT } from './e2e/portfolio-media'

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000'
const devHost = process.env.PLAYWRIGHT_DEV_HOST ?? '127.0.0.1'

const webServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER
  ? undefined
  : {
      command: `NUXT_IGNORE_LOCK=1 pnpm exec nuxt dev --host ${devHost} --port 3000`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        NUXT_APP_SECRET:
          process.env.NUXT_APP_SECRET ?? 'playwright-dev-secret-min-32-chars',
      },
    }

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  outputDir: 'videos/.playwright-output',
  use: {
    baseURL,
    ...devices['Desktop Chrome'],
    viewport: { ...PORTFOLIO_VIEWPORT },
    deviceScaleFactor: 1,
    video: {
      mode: 'on',
      size: { ...PORTFOLIO_VIEWPORT },
    },
    launchOptions: {
      slowMo: 0,
    },
    trace: 'off',
  },
  ...(webServer ? { webServer } : {}),
})
