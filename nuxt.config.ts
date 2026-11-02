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
