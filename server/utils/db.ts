import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'

export type AppDb = ReturnType<typeof drizzle<typeof schema>>

let _db: AppDb | null = null

export function useDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL || 'file:./.data/dev.sqlite'
    const path = url.replace(/^file:/, '')
    const sqlite = new Database(path)
    sqlite.pragma('foreign_keys = ON')
    _db = drizzle(sqlite, { schema })
  }
  return _db
}

export function setDbForTests(db: AppDb | null) {
  _db = db
}
