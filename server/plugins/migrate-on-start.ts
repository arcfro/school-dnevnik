import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator'
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator'
import { seedDevAdmin } from '../db/seed'
import { getMigrationsFolder, isPostgresDatabase, useDb } from '../utils/db'

export default defineNitroPlugin(async () => {
  if (!isPostgresDatabase()) {
    mkdirSync(resolve(process.cwd(), '.data'), { recursive: true })
  }

  const db = useDb()
  const migrationsFolder = resolve(process.cwd(), getMigrationsFolder())

  if (isPostgresDatabase()) {
    await migratePostgres(db, { migrationsFolder })
  } else {
    migrateSqlite(db, { migrationsFolder })
  }

  if (import.meta.dev && !isPostgresDatabase()) {
    await seedDevAdmin()
  }
})
