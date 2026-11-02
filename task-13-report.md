# Task 13 — PostgreSQL path + Docker

## Сделано

- **`server/utils/db.ts`**: dual driver — SQLite (`better-sqlite3`) по умолчанию / `file:…`, PostgreSQL при `DATABASE_URL` с `postgresql://` или `postgres://` через `postgres` + `drizzle-orm/postgres-js`. Хелперы `getDatabaseUrl`, `isPostgresDatabase`, `getMigrationsFolder`.
- **`server/plugins/migrate-on-start.ts`**: async migrator для Postgres, sqlite migrator для dev; сид админа только в dev и только на SQLite.
- **`drizzle.config.ts`**: переключение dialect/out через `DRIZZLE_DIALECT=postgresql` или Postgres `DATABASE_URL`.
- **`server/db/migrations-pg/`**: начальная PG-миграция (порядок таблиц с учётом FK), journal `postgresql`.
- **`docker-compose.yml`**: `postgres:16-alpine` + app, healthcheck, volume `pgdata`.
- **`Dockerfile`**: multi-stage pnpm build, в runtime копируются обе папки миграций.
- **`.dockerignore`**
- **`tests/unit/db-postgres-config.test.ts`**: smoke URL/folder + injected sqlite `useDb`.
- **`README.md`**: секция «Migrate dev → prod».

## Зависимости

- `postgres@4.0.0`

## Проверка

```bash
pnpm vitest run   # 72 passed
docker compose up --build   # локально (в CI sandbox docker не был доступен)
```

## Заметки

- Схема Drizzle остаётся `sqliteTable`; PG совместим по типам (text/integer timestamps). Новые изменения схемы — обновлять `migrations` и `migrations-pg` (или `drizzle-kit generate` с `DRIZZLE_DIALECT=postgresql`).
- Автосид `admin@school.local` в Docker/prod не включён — только `pnpm dev` + SQLite.

## Commit

`chore: docker and postgres support`
