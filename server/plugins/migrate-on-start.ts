import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { seedDevAdmin } from '../db/seed'
import { useDb } from '../utils/db'

export default defineNitroPlugin(async () => {
  mkdirSync(resolve(process.cwd(), '.data'), { recursive: true })
  migrate(useDb(), {
    migrationsFolder: resolve(process.cwd(), 'server/db/migrations'),
  })
  if (import.meta.dev) {
    await seedDevAdmin()
  }
})
