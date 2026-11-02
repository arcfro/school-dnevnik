import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../../server/db/schema'

describe('schema migrate', () => {
  it('applies migrations on empty sqlite', () => {
    const sqlite = new Database(':memory:')
    const db = drizzle(sqlite, { schema })
    migrate(db, { migrationsFolder: 'server/db/migrations' })
    const rows = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const names = rows.map((r: { name: string }) => r.name)
    expect(names).toContain('users')
    expect(names).toContain('jobs')
  })
})
