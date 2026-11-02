export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: ['nuxt-auth-utils', '@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Дневник',
      short_name: 'Дневник',
      description: 'Школьный электронный дневник',
      lang: 'ru',
      display: 'standalone',
      start_url: '/',
      theme_color: '#4f46e5',
      background_color: '#eef2ff',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
  css: ['~/assets/css/main.css'],
  components: [
    { path: '~/components' },
    { path: '~/components/shell', pathPrefix: false },
  ],
  app: {
    head: {
      title: 'Дневник',
      htmlAttrs: { lang: 'ru' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
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
