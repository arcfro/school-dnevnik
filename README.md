# Дневник

Школьный электронный дневник на Nuxt 4.

## Dev login

`pnpm dev` создаёт `.data/`, накатывает миграции и сеет админа (идемпотентно):

- email: `admin@school.local`
- password: `admin123`

Сидер: `server/db/seed.ts`.

## Web Push

Сгенерировать VAPID-ключи и записать в `.env`:

```bash
npx web-push generate-vapid-keys
```

`VAPID_PUBLIC_KEY` и `VAPID_PRIVATE_KEY` — пара из команды. `VAPID_SUBJECT` — `mailto:` школы.

Родитель включает подписку на `/parent/settings`. `SEND_PUSH` в очереди шлёт `{ title, body, url }` на сохранённые endpoint'ы.

В проде нужен HTTPS. На iPhone push только после установки PWA на домашний экран.

## PWA

Модуль `@vite-pwa/nuxt`: manifest «Дневник», `display: standalone`, иконки `public/icon-192.png` и `public/icon-512.png`, Workbox SW (`sw.js`, `registerType: autoUpdate`).

Установка на телефон:

- Android Chrome: меню → «Установить приложение» / «Добавить на главный экран».
- iPhone Safari: «Поделиться» → «На экран Домой» (push работает только так).

HTTPS обязателен для установки PWA и Web Push вне `localhost`. Локально `pnpm dev` поднимает dev SW (`devOptions.enabled`); для проверки installability удобнее `pnpm build && pnpm preview` по HTTPS или через reverse proxy с TLS.

Push по-прежнему через отдельный `public/push-sw.js` (Task 11); PWA SW кэширует статику приложения.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
