import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../../server/db/schema'
import { setDbForTests, type AppDb } from '../../server/utils/db'

export function createTestDb(): AppDb {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: 'server/db/migrations' })
  setDbForTests(db)
  return db
}

export function resetTestDb() {
  setDbForTests(null)
}
