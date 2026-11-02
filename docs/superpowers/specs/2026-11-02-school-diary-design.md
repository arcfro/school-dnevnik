# Design: школьный электронный дневник (dnevnik)

**Date:** 2026-11-02  
**Status:** draft for review  
**Source:** `agent.spec` + brainstorming session

## Summary

Цифровая платформа для **одной школы**: электронный дневник/журнал (расписание, оценки, посещаемость, домашние задания), **PWA**, уведомления **in-app + Web Push** (мессенджеры — позже). Интеграция **Bitrix24** в v1 — **заглушки** (контракт + очередь jobs, без REST). Стек: **Nuxt + Vue**, **Drizzle**, **SQLite (dev) → PostgreSQL (prod)**. UI — **UI UX Pro Max** на этапе реализации.

## Goals (v1)

| Goal | Scope |
|------|--------|
| Admin | Классы, ученики, предметы, расписание, пользователи, привязка родитель ↔ ученик |
| Teacher | Журнал (оценки, посещаемость), выдача ДЗ по своим class/subject |
| Parent | Read-only: расписание, оценки, ДЗ ребёнка; push + in-app на новую оценку / новое ДЗ |
| PWA | Install, manifest, service worker (static + session); Web Push |
| Bitrix24 | Stub client + job types; real REST — v2 |
| Out of v1 | Мессенджеры, ученический login, сдача ДЗ, чат, multi-tenant, live B24 |

## Architecture

**Variant:** монолит Nuxt (Nitro API + UI + фоновая обработка jobs в том же деплое).

```
app/          — pages, role layouts (admin | teacher | parent)
components/
server/
  api/        — HTTP handlers (thin)
  services/   — business logic
  db/         — Drizzle schema, migrations
  jobs/       — job types, processor
  integrations/bitrix/ — BitrixClient + StubBitrixClient
```

**Rules:**

- Handlers → service → DB; без бизнес-логики в handlers.
- Side effects (notifications, B24 jobs) — после успешной транзакции через `enqueueJob()`.
- RBAC: middleware по role + проверки scope в services (teacher только свои class_subjects; parent только linked students).

## Roles and auth

- **Auth:** email + password, сессия (server-side). Magic link — optional v1.1.
- **Roles:** `admin`, `teacher`, `parent`.
- **Students:** сущности без аккаунта в v1; доступ родителя через `parent_students`.
- **Redirects after login:** `/admin`, `/teacher`, `/parent`.

## Data model (core)

| Table | Purpose |
|-------|---------|
| `users` | email, password_hash, role, name |
| `students` | name, class_id |
| `classes` | name, grade level metadata optional |
| `subjects` | name |
| `class_subjects` | class_id, subject_id, teacher_user_id |
| `parent_students` | parent user_id, student_id |
| `schedule_slots` | class_id, day_of_week, lesson_index, subject_id, teacher_user_id, room optional |
| `grade_entries` | student_id, subject_id, date, value, type optional, teacher_user_id, comment optional |
| `attendance` | student_id, date, subject_id or slot ref, status enum, teacher_user_id |
| `homework` | class_id, subject_id, title, body, due_at optional, created_by |
| `notifications` | user_id, type, payload JSON, read_at optional |
| `push_subscriptions` | user_id, endpoint, p256dh, auth |
| `jobs` | type, payload JSON, status, attempts, run_at, last_error |
| `bitrix_links` | local_entity, local_id, b24_entity, b24_id nullable, sync_state |

IDs: text/UUID. Timestamps: UTC. JSON: sqlite text / postgres jsonb.

## API surface (groups)

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Admin:** CRUD classes, students (nested), subjects, class_subjects, users, parent_students, schedule_slots; `GET /api/admin/jobs`
- **Teacher:** journal read/write (scoped), homework CRUD (scoped)
- **Parent:** GET children, schedule, grades, homework (scoped to linked students); notifications list/mark read
- **Push:** `POST /api/push/subscribe`, `DELETE /api/push/subscribe`
- **Internal:** `POST /api/internal/jobs/process` — poll pending jobs (cron + secret header)

Errors: `{ error, message }`; validation via zod → 400.

## Notifications (v1)

**Events → DB + jobs:**

| Event | Recipients | Job |
|-------|------------|-----|
| Grade created | Parents of student | `SEND_PUSH` if subscribed |
| Homework created | Parents of class | `SEND_PUSH` if subscribed |

In-app: pull on `/parent/notifications` + unread count on shell.

**Future:** `NotificationChannel` interface for Telegram/WhatsApp (not implemented v1).

## Bitrix24 (stub only v1)

```ts
interface BitrixClient {
  upsertParentContact(payload): Promise<{ b24Id: string }>
  createLead(payload): Promise<{ b24Id: string }>
  createDeal(payload): Promise<{ b24Id: string }>
  createTask(payload): Promise<{ b24Id: string }>
}
```

- **StubBitrixClient:** log + synthetic ids (`stub-contact-…`), writes `bitrix_links`.
- **Job types:** `B24_UPSERT_PARENT`, `B24_CREATE_LEAD`, `B24_CREATE_DEAL`, `B24_CREATE_TASK`.
- **v1 trigger:** admin creates/links parent → `B24_UPSERT_PARENT` when `BITRIX_ENABLED=true`.
- **v2:** `BITRIX_MODE=live`, OAuth/webhook tokens, real REST — same interface.

Env: `BITRIX_MODE=stub`, `BITRIX_ENABLED=true|false`.

## User flows and routes

See brainstorming section 2 — key routes:

- `/login`
- `/admin/*` — classes, students, subjects, schedule, users, jobs debug
- `/teacher/*` — dashboard, journal, homework
- `/parent/*` — dashboard, schedule, grades, homework, notifications, settings (push)

Parent with multiple children: child switcher (persist localStorage).

## PWA

- `@vite-pwa/nuxt`: manifest, icons, install prompt.
- SW: cache static assets; API network-first (no offline journal promise v1).
- Web Push: VAPID keys; HTTPS required in prod; iOS requires installed PWA — document in UI.

## Environment

```bash
NUXT_SESSION_PASSWORD=
DATABASE_URL=file:./.data/dev.sqlite   # prod: postgresql://...

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@school.local

BITRIX_MODE=stub
BITRIX_ENABLED=true
```

Internal job endpoint: shared secret header (e.g. `X-Job-Secret`).

## Deployment

- **Dev:** pnpm dev, SQLite under `.data/`, manual job process via admin or curl.
- **Prod:** Docker (Nuxt + Postgres); cron hits job processor every 30–60s.
- **Postgres cutover:** drizzle migrations on empty DB; no automatic SQLite file sync to prod.

## Testing

- **Vitest:** services (RBAC, notify recipients, job enqueue rules).
- **API tests:** sqlite `:memory:` — e.g. create grade → notification rows + job.
- **Manual:** PWA install + push on staging.
- **Critical paths:** parent cannot read other students; teacher cannot write outside class_subjects.

## Implementation waves

1. Scaffold — Nuxt, Drizzle, auth, layouts, middleware, stub pages
2. Admin core — classes, students, subjects, class_subjects, users, parent_students
3. Schedule — admin CRUD, teacher/parent read
4. Journal — grades + attendance
5. Homework — teacher write, parent read
6. Notifications — in-app + job enqueue
7. Web Push — VAPID, subscribe, SEND_PUSH processor
8. PWA — manifest, SW
9. B24 stub — client, jobs, admin jobs viewer
10. Postgres path — compose, migrate docs, CI migrate check

UI UX Pro Max: from wave 2–3 onward (tokens + components).

## Risks

- iOS Web Push only in installed PWA — show instructions.
- Multi-child parents — switcher from day one.
- Teacher multi-class — journal uses explicit query params (class, subject, date).

## Open items (post-v1)

- Live Bitrix24 REST + deal/task automation
- Messenger notification channels
- Student accounts and homework submission
- SSE or polling interval for in-app realtime
