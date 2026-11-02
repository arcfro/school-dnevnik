# School Diary (dnevnik) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a single-school Nuxt PWA with admin/teacher/parent roles, journal (grades + attendance), homework, in-app + Web Push notifications, and Bitrix24 stub integration.

**Architecture:** Nuxt monolith — Vue pages, Nitro `server/api` handlers calling `server/services`, Drizzle ORM on SQLite (dev) / PostgreSQL (prod), side effects via `jobs` table + processor endpoint.

**Tech Stack:** Nuxt 3, Vue 3, TypeScript, Drizzle ORM, better-sqlite3 (dev), postgres (prod), Zod, Vitest, nuxt-auth-utils (session), @vite-pwa/nuxt, web-push, UI UX Pro Max (design tokens/components from Task 2 onward).

**Spec:** [docs/superpowers/specs/2026-11-02-school-diary-design.md](../specs/2026-11-02-school-diary-design.md)

## Global Constraints

- One school only — no `school_id` multi-tenant routing.
- Roles: `admin` | `teacher` | `parent`; students have no login in v1.
- Auth: email + password, server session — no Bitrix OAuth.
- Notifications v1: in-app + Web Push only — no messengers.
- Bitrix: `BITRIX_MODE=stub`, `StubBitrixClient` only — no REST to portal in v1.
- DB: `DATABASE_URL=file:./.data/dev.sqlite` locally; PostgreSQL in prod via same Drizzle schema.
- RBAC enforced in services — parent only linked students; teacher only assigned `class_subjects`.

---

## Target file structure (greenfield)

```
dnevnik/
  app.vue
  nuxt.config.ts
  drizzle.config.ts
  package.json
  .env.example
  app/
    middleware/
      auth.global.ts
      role.ts
    layouts/
      default.vue
      admin.vue
      teacher.vue
      parent.vue
    pages/
      login.vue
      admin/index.vue
      admin/classes/...
      teacher/...
      parent/...
  components/
    ui/                    # UI UX Pro Max tokens/components
    shell/AppHeader.vue
  server/
    utils/
      db.ts                 # drizzle singleton
      session.ts
      password.ts
    db/
      schema.ts
      migrations/
    services/
      classes.service.ts
      students.service.ts
      subjects.service.ts
      users.service.ts
      schedule.service.ts
      journal.service.ts
      homework.service.ts
      notifications.service.ts
      jobs.service.ts
    jobs/
      types.ts
      processor.ts
    integrations/bitrix/
      client.ts
      stub-client.ts
    api/
      auth/login.post.ts
      auth/logout.post.ts
      auth/me.get.ts
      admin/...
      teacher/...
      parent/...
      push/subscribe.post.ts
      push/subscribe.delete.ts
      internal/jobs/process.post.ts
  tests/
    unit/
    api/
  docker-compose.yml
  Dockerfile
  README.md
```

---

### Task 1: Nuxt scaffold + tooling

**Files:**
- Create: `package.json`, `nuxt.config.ts`, `tsconfig.json`, `app.vue`, `.gitignore`, `.env.example`, `README.md`
- Create: `app/pages/index.vue` (redirect placeholder)

**Interfaces:**
- Produces: runnable `pnpm dev` on port 3000

- [ ] **Step 1: Init project**

```bash
cd /Users/arcfro/dev/dnevnik
pnpm dlx nuxi@latest init . --force --packageManager pnpm
pnpm add -D typescript vitest @vue/test-utils happy-dom drizzle-kit
pnpm add drizzle-orm better-sqlite3 zod
pnpm add -D @types/better-sqlite3
```

- [ ] **Step 2: Configure `nuxt.config.ts`**

```ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || '',
    jobSecret: process.env.NUXT_JOB_SECRET || 'dev-job-secret',
    bitrixMode: process.env.BITRIX_MODE || 'stub',
    bitrixEnabled: process.env.BITRIX_ENABLED !== 'false',
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
    vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@school.local',
    public: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    },
  },
})
```

- [ ] **Step 3: Add `.env.example`**

```bash
NUXT_SESSION_PASSWORD=change-me-32-chars-minimum________
DATABASE_URL=file:./.data/dev.sqlite
NUXT_JOB_SECRET=dev-job-secret
BITRIX_MODE=stub
BITRIX_ENABLED=true
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@school.local
```

- [ ] **Step 4: Verify dev server**

Run: `pnpm dev`  
Expected: Nuxt welcome or index loads at `http://localhost:3000`

- [ ] **Step 5: Init git and commit**

```bash
git init
git add .
git commit -m "chore: nuxt scaffold and tooling"
```

---

### Task 2: Drizzle schema + DB bootstrap

**Files:**
- Create: `server/db/schema.ts`, `server/utils/db.ts`, `drizzle.config.ts`, `server/db/migrations/*`
- Create: `tests/unit/db-schema.test.ts`
- Modify: `.gitignore` (add `.data/`)

**Interfaces:**
- Produces: `useDb()` returning Drizzle instance; exported tables from `schema.ts`

- [ ] **Step 1: Write schema** (`server/db/schema.ts`)

Define tables with `sqliteTable` + `text` ids (`crypto.randomUUID()`), enums as text columns: `users`, `classes`, `students`, `subjects`, `class_subjects`, `parent_students`, `schedule_slots`, `grade_entries`, `attendance`, `homework`, `notifications`, `push_subscriptions`, `jobs`, `bitrix_links`. Include indexes on foreign keys.

- [ ] **Step 2: Write failing test**

```ts
// tests/unit/db-schema.test.ts
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
```

- [ ] **Step 3: Configure drizzle-kit** (`drizzle.config.ts`)

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: { url: process.env.DATABASE_URL?.replace('file:', '') || './.data/dev.sqlite' },
})
```

Run: `mkdir -p .data && pnpm drizzle-kit generate`  
Run: `pnpm vitest run tests/unit/db-schema.test.ts`  
Expected: PASS

- [ ] **Step 4: `server/utils/db.ts`**

```ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../db/schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

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
```

- [ ] **Step 5: Commit**

```bash
git add server/db server/utils/db.ts drizzle.config.ts tests/unit/db-schema.test.ts
git commit -m "feat: drizzle schema and sqlite bootstrap"
```

---

### Task 3: Auth (session + login)

**Files:**
- Create: `server/utils/password.ts`, `server/services/users.service.ts` (auth helpers)
- Create: `server/api/auth/login.post.ts`, `logout.post.ts`, `me.get.ts`
- Create: `app/pages/login.vue`, `app/middleware/auth.global.ts`, `app/middleware/role.ts`
- Create: `tests/unit/password.test.ts`
- Modify: `nuxt.config.ts` — add `nuxt-auth-utils` module
- Create: `server/plugins/migrate-on-start.ts` (run migrations in dev)

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain, hash): Promise<boolean>`
- Produces: session user shape `{ id: string, email: string, role: 'admin'|'teacher'|'parent', name: string }`

- [ ] **Step 1: Install auth**

```bash
pnpm add nuxt-auth-utils
pnpm add scrypt-kdf
```

Add to `nuxt.config.ts`: `modules: ['nuxt-auth-utils']`

- [ ] **Step 2: Password util test + impl**

```ts
// tests/unit/password.test.ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../server/utils/password'

it('hashes and verifies', async () => {
  const hash = await hashPassword('secret123')
  expect(await verifyPassword('secret123', hash)).toBe(true)
  expect(await verifyPassword('wrong', hash)).toBe(false)
})
```

- [ ] **Step 3: Login API** — validate body with zod `{ email, password }`, load user, verify, `setUserSession`, return user without hash.

- [ ] **Step 4: Login page** — form posts to `/api/auth/login`, redirect by role.

- [ ] **Step 5: Middleware** — unauthenticated → `/login`; role middleware on layouts.

- [ ] **Step 6: Seed script** `server/db/seed.ts` — one admin `admin@school.local` / `admin123` for dev; document in README.

Run: `pnpm vitest run tests/unit/password.test.ts`  
Run: manual login in browser  
Expected: redirect to `/admin`

- [ ] **Step 7: Commit**

```bash
git commit -am "feat: email password auth and session"
```

---

### Task 4: Layouts + role shells + UI UX Pro Max baseline

**Files:**
- Create: `app/layouts/admin.vue`, `teacher.vue`, `parent.vue`, `default.vue`
- Create: `components/shell/AppHeader.vue`
- Create: `assets/css/tokens.css`, `assets/css/main.css`
- Modify: role pages stubs under `app/pages/admin/index.vue`, etc.
- Read skill: `$1/ui-ux-pro-max/SKILL.md` — apply typography/color/spacing tokens to `tokens.css`

**Interfaces:**
- Produces: consistent shell with logout + nav links per role

- [ ] **Step 1:** Import UI UX Pro Max guidance — set CSS variables (font, primary, surface, radius).
- [ ] **Step 2:** Wire layouts to `definePageMeta({ layout: 'admin', middleware: ['role'] })` with allowed roles.
- [ ] **Step 3:** Empty dashboard pages with heading + nav.
- [ ] **Step 4: Commit** `feat: role layouts and design tokens`

---

### Task 5: Admin — classes, students, subjects, class_subjects

**Files:**
- Create: `server/services/classes.service.ts`, `students.service.ts`, `subjects.service.ts`
- Create: `server/api/admin/classes/*.ts`, `students/*.ts`, `subjects/*.ts`, `class-subjects/*.ts`
- Create: `app/pages/admin/classes/index.vue`, `[id].vue`, `subjects/index.vue`
- Create: `tests/unit/rbac-admin.test.ts` (non-admin rejected — mock session or call service with role check)

**Interfaces:**
- Produces: `createClass(name)`, `listClasses()`, `createStudent(classId, name)`, `assignClassSubject(classId, subjectId, teacherUserId)`

- [ ] **Step 1:** Service methods with zod inputs; admin-only guard `assertRole(user, 'admin')`.
- [ ] **Step 2:** API routes thin wrappers.
- [ ] **Step 3:** Vue forms with client validation + error toast.
- [ ] **Step 4:** Test `assertRole` throws for teacher calling admin service.
- [ ] **Step 5: Commit** `feat: admin classes students subjects`

---

### Task 6: Admin — users, parent_students, B24 enqueue stub

**Files:**
- Create: `server/api/admin/users/*.ts`, `parent-students/*.ts`
- Create: `server/integrations/bitrix/client.ts`, `stub-client.ts`
- Create: `server/services/jobs.service.ts` — `enqueueJob(type, payload)`
- Modify: `users.service.ts` — create parent/teacher
- Create: `app/pages/admin/users/index.vue`, `[id].vue`

**Interfaces:**
- Produces: `enqueueJob(type: JobType, payload: Record<string, unknown>): Promise<string /* jobId */>`
- Produces: `BitrixClient` interface + `createBitrixClient(mode): BitrixClient`

```ts
// server/integrations/bitrix/client.ts
export interface BitrixClient {
  upsertParentContact(payload: { email: string; name: string; localUserId: string }): Promise<{ b24Id: string }>
  createLead(payload: Record<string, unknown>): Promise<{ b24Id: string }>
  createDeal(payload: Record<string, unknown>): Promise<{ b24Id: string }>
  createTask(payload: Record<string, unknown>): Promise<{ b24Id: string }>
}
```

Stub returns `{ b24Id: 'stub-contact-' + localUserId }` and inserts `bitrix_links`.

- [ ] **Step 1:** On parent user create (when `runtimeConfig.bitrixEnabled`), `enqueueJob('B24_UPSERT_PARENT', { userId })`.
- [ ] **Step 2:** Admin UI link parent ↔ student (multi-child supported).
- [ ] **Step 3: Commit** `feat: admin users parent links and b24 job enqueue`

---

### Task 7: Schedule

**Files:**
- Create: `server/services/schedule.service.ts`
- Create: `server/api/admin/schedule/*.ts`, `teacher/schedule.get.ts`, `parent/schedule.get.ts`
- Create: `app/pages/admin/schedule/[classId].vue`, `teacher/index.vue`, `parent/schedule.vue`

**Interfaces:**
- Produces: `upsertSlot(...)`, `getScheduleForClass(classId)`, parent variant scoped to linked student class

- [ ] **Step 1:** Admin grid editor (day × lesson index).
- [ ] **Step 2:** Teacher/parent read APIs with RBAC tests.
- [ ] **Step 3: Commit** `feat: schedule crud and read`

---

### Task 8: Journal (grades + attendance)

**Files:**
- Create: `server/services/journal.service.ts`
- Create: `server/api/teacher/journal/*.ts`, `parent/grades.get.ts`
- Create: `app/pages/teacher/journal.vue`, `parent/grades.vue`
- Create: `tests/unit/journal-scope.test.ts`

**Interfaces:**
- Produces: `saveGrades(teacherId, classId, subjectId, date, entries[])`, `saveAttendance(...)`
- Consumes: `class_subjects` to verify teacher scope

- [ ] **Step 1:** Test teacher cannot write for unassigned class/subject — expect throw `ForbiddenError`.
- [ ] **Step 2:** Inline table UI for grades + attendance toggles.
- [ ] **Step 3:** Parent read last 30 days filter.
- [ ] **Step 4: Commit** `feat: journal grades and attendance`

---

### Task 9: Homework

**Files:**
- Create: `server/services/homework.service.ts`
- Create: `server/api/teacher/homework/*.ts`, `parent/homework.get.ts`
- Create: `app/pages/teacher/homework/index.vue`, `new.vue`, `parent/homework.vue`

**Interfaces:**
- Produces: `createHomework(...)`, `listHomeworkForClass(classId)`, parent list filtered by child's class

- [ ] **Step 1:** Teacher create form.
- [ ] **Step 2:** Parent list active homework (`due_at >= today OR null`).
- [ ] **Step 3: Commit** `feat: homework`

---

### Task 10: Notifications + job processor + in-app UI

**Files:**
- Create: `server/services/notifications.service.ts`
- Modify: `journal.service.ts`, `homework.service.ts` — after save, call `notifyParentsOfGrade` / `notifyParentsOfHomework`
- Create: `server/jobs/types.ts`, `processor.ts`
- Create: `server/api/parent/notifications/*.ts`, `internal/jobs/process.post.ts`, `admin/jobs.get.ts`
- Create: `app/pages/parent/notifications.vue`, `admin/jobs/index.vue`

**Interfaces:**
- Produces: `createNotification(userId, type, payload)`, `enqueueJob('SEND_PUSH', { userId, notificationId })`
- Job processor: fetch pending jobs where `run_at <= now`, mark processing, dispatch by type

```ts
// server/jobs/types.ts
export type JobType =
  | 'B24_UPSERT_PARENT'
  | 'B24_CREATE_LEAD'
  | 'B24_CREATE_DEAL'
  | 'B24_CREATE_TASK'
  | 'SEND_PUSH'
```

- [ ] **Step 1:** Test creating grade creates notification row for parent.
- [ ] **Step 2:** `POST /api/internal/jobs/process` requires header `X-Job-Secret`.
- [ ] **Step 3:** Admin jobs page lists status + last_error.
- [ ] **Step 4: Commit** `feat: notifications and job processor`

---

### Task 11: Web Push

**Files:**
- Create: `server/api/push/subscribe.post.ts`, `subscribe.delete.ts`
- Modify: `processor.ts` — handle `SEND_PUSH` via `web-push`
- Create: `app/pages/parent/settings.vue` — subscribe button using `public.vapidPublicKey`
- Modify: `.env.example` with VAPID keys generation note in README

```bash
pnpm add web-push
pnpm add -D @types/web-push
```

- [ ] **Step 1:** Store subscription in `push_subscriptions`.
- [ ] **Step 2:** SEND_PUSH sends payload `{ title, body, url }`.
- [ ] **Step 3:** iOS hint text on settings page.
- [ ] **Step 4: Commit** `feat: web push subscriptions and send job`

---

### Task 12: PWA

**Files:**
- Modify: `nuxt.config.ts` — `@vite-pwa/nuxt`
- Create: `public/icon-192.png`, `public/icon-512.png` (placeholder or generated)
- Modify: `README.md` — install + HTTPS notes

```bash
pnpm add -D @vite-pwa/nuxt
```

- [ ] **Step 1:** PWA manifest `name: 'Дневник'`, `display: 'standalone'`.
- [ ] **Step 2:** Verify Lighthouse installable (manual).
- [ ] **Step 3: Commit** `feat: pwa manifest and service worker`

---

### Task 13: PostgreSQL path + Docker

**Files:**
- Create: `docker-compose.yml`, `Dockerfile`
- Modify: `server/utils/db.ts` — branch on `DATABASE_URL` starting with `postgresql`
- Modify: `drizzle.config.ts` — document second config or env switch for postgres dialect
- Create: `tests/unit/db-postgres-config.test.ts` (smoke: postgres driver import guarded)

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: dnevnik
      POSTGRES_PASSWORD: dnevnik
      POSTGRES_DB: dnevnik
  app:
    build: .
    ports: ['3000:3000']
    environment:
      DATABASE_URL: postgresql://dnevnik:dnevnik@db:5432/dnevnik
    depends_on: [db]
```

- [ ] **Step 1:** Add `postgres` package; dual driver in `useDb()`.
- [ ] **Step 2:** README section "Migrate dev → prod".
- [ ] **Step 3: Commit** `chore: docker and postgres support`

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Admin CRUD core | 5, 6, 7 |
| Teacher journal + homework | 8, 9 |
| Parent read + push triggers | 8, 9, 10, 11 |
| Auth email/password | 3 |
| Jobs + B24 stub | 6, 10 |
| PWA | 12 |
| SQLite dev / Postgres prod | 2, 13 |
| UI UX Pro Max | 4 + ongoing in 5–12 |
| Internal job cron endpoint | 10 |
| Out of scope (messengers, live B24) | not planned |

No TBD steps in task bodies; each task ends with test or manual verify + commit.

---

## Plan complete

Saved to `docs/superpowers/plans/2026-11-02-school-diary.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — same session, batches with checkpoints (`executing-plans`)

Which approach?
