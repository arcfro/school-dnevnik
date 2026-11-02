import { defineConfig } from 'drizzle-kit'

/**
 * Dev (default): SQLite → `server/db/migrations`
 * Postgres: set `DRIZZLE_DIALECT=postgresql` and `DATABASE_URL=postgresql://...`
 *           → `server/db/migrations-pg` (maintain alongside sqlite migrations)
 */
const postgres =
  process.env.DRIZZLE_DIALECT === 'postgresql' ||
  process.env.DATABASE_URL?.startsWith('postgresql://') ||
  process.env.DATABASE_URL?.startsWith('postgres://')

export default defineConfig(
  postgres
    ? {
        schema: './server/db/schema.ts',
        out: './server/db/migrations-pg',
        dialect: 'postgresql',
        dbCredentials: {
          url: process.env.DATABASE_URL!,
        },
      }
    : {
        schema: './server/db/schema.ts',
        out: './server/db/migrations',
        dialect: 'sqlite',
        dbCredentials: {
          url: process.env.DATABASE_URL?.replace('file:', '') || './.data/dev.sqlite',
        },
      },
)
