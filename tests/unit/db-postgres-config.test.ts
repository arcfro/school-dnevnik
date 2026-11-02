import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('db postgres config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('detects postgresql DATABASE_URL and migrations folder', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://dnevnik:dnevnik@db:5432/dnevnik')
    const { isPostgresDatabase, getMigrationsFolder } = await import('../../server/utils/db')
    expect(isPostgresDatabase()).toBe(true)
    expect(getMigrationsFolder()).toBe('server/db/migrations-pg')
  })

  it('accepts postgres:// scheme', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://localhost/dnevnik')
    const { isPostgresDatabase } = await import('../../server/utils/db')
    expect(isPostgresDatabase()).toBe(true)
  })

  it('defaults to sqlite file URL', async () => {
    vi.stubEnv('DATABASE_URL', '')
    delete process.env.DATABASE_URL
    const { getDatabaseUrl, isPostgresDatabase, getMigrationsFolder } = await import(
      '../../server/utils/db'
    )
    expect(getDatabaseUrl()).toBe('file:./.data/dev.sqlite')
    expect(isPostgresDatabase()).toBe(false)
    expect(getMigrationsFolder()).toBe('server/db/migrations')
  })

  it('useDb with injected sqlite db does not open postgres', async () => {
    const Database = (await import('better-sqlite3')).default
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const schema = await import('../../server/db/schema')
    const { setDbForTests, useDb } = await import('../../server/utils/db')

    const sqlite = new Database(':memory:')
    sqlite.pragma('foreign_keys = ON')
    setDbForTests(drizzle(sqlite, { schema }))
    expect(useDb()).toBeDefined()
    setDbForTests(null)
  })
})
