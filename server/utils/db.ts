import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

type SqliteDb = ReturnType<typeof drizzleSqlite<typeof schema>>
type PostgresDb = ReturnType<typeof drizzlePostgres<typeof schema>>

export type AppDb = SqliteDb | PostgresDb

let _db: AppDb | null = null
let _pgClient: ReturnType<typeof postgres> | null = null

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || 'file:./.data/dev.sqlite'
}

export function isPostgresDatabase(url = getDatabaseUrl()): boolean {
  return url.startsWith('postgresql://') || url.startsWith('postgres://')
}

export function getMigrationsFolder(): 'server/db/migrations-pg' | 'server/db/migrations' {
  return isPostgresDatabase() ? 'server/db/migrations-pg' : 'server/db/migrations'
}

export function useDb(): AppDb {
  if (!_db) {
    const url = getDatabaseUrl()
    if (isPostgresDatabase(url)) {
      _pgClient = postgres(url, { max: 10 })
      _db = drizzlePostgres(_pgClient, { schema })
    } else {
      const path = url.replace(/^file:/, '')
      const sqlite = new Database(path)
      sqlite.pragma('foreign_keys = ON')
      _db = drizzleSqlite(sqlite, { schema })
    }
  }
  return _db
}

export function setDbForTests(db: AppDb | null) {
  _db = db
}

export async function closeDbForTests() {
  if (_pgClient) {
    await _pgClient.end({ timeout: 0 })
    _pgClient = null
  }
  _db = null
}
