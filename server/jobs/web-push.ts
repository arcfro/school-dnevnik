import webPush from 'web-push'
import type { PushSender } from '../services/push.service'

export function createWebPushSender(
  config: {
    publicKey?: string
    privateKey?: string
    subject?: string
  } = {},
): PushSender {
  const publicKey = config.publicKey ?? process.env.VAPID_PUBLIC_KEY ?? ''
  const privateKey = config.privateKey ?? process.env.VAPID_PRIVATE_KEY ?? ''
  const subject = config.subject ?? process.env.VAPID_SUBJECT ?? 'mailto:admin@school.local'

  return {
    async send(subscription, payload) {
      if (!publicKey || !privateKey) {
        throw new Error('VAPID-ключи не заданы')
      }
      webPush.setVapidDetails(subject, publicKey, privateKey)
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify(payload),
      )
    },
  }
}
