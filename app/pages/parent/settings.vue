<script setup lang="ts">
definePageMeta({
  layout: 'parent',
  middleware: ['role'],
  roles: ['parent'],
})

const config = useRuntimeConfig()
const vapidPublicKey = computed(() => String(config.public.vapidPublicKey || ''))
const status = ref<'on' | 'off' | 'unsupported' | 'denied' | 'missing-key'>('off')
const busy = ref(false)
const error = ref('')

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

async function refreshStatus() {
  if (!import.meta.client) return
  try {
    if (!vapidPublicKey.value) {
      status.value = 'missing-key'
      return
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      status.value = 'unsupported'
      return
    }
    if (Notification.permission === 'denied') {
      status.value = 'denied'
      return
    }
    const registration = await Promise.race([
      navigator.serviceWorker.getRegistration('/push-sw.js'),
      new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500)),
    ])
    const subscription = await registration?.pushManager.getSubscription()
    status.value = subscription ? 'on' : 'off'
  } catch {
    status.value = vapidPublicKey.value ? 'off' : 'missing-key'
  }
}

onMounted(() => {
  void refreshStatus()
})

async function enablePush() {
  busy.value = true
  error.value = ''
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      status.value = permission === 'denied' ? 'denied' : 'off'
      return
    }
    const registration = await navigator.serviceWorker.register('/push-sw.js')
    await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey.value),
    })
    await $fetch('/api/push/subscribe', { method: 'POST', body: subscription.toJSON() })
    status.value = 'on'
  } catch (e) {
    error.value = apiErrorMessage(e, 'Не удалось включить уведомления')
  } finally {
    busy.value = false
  }
}

async function disablePush() {
  busy.value = true
  error.value = ''
  try {
    const registration = await navigator.serviceWorker.getRegistration('/push-sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) {
      await $fetch('/api/push/subscribe', {
        method: 'DELETE',
        body: { endpoint: subscription.endpoint },
      })
      await subscription.unsubscribe()
    }
    status.value = 'off'
  } catch (e) {
    error.value = apiErrorMessage(e, 'Не удалось отключить уведомления')
  } finally {
    busy.value = false
  }
}

const statusText: Record<typeof status.value, string> = {
  on: 'Push включены на этом устройстве.',
  off: 'Push выключены.',
  unsupported: 'Этот браузер не умеет Web Push.',
  denied: 'Разрешение на уведомления отклонено в браузере.',
  'missing-key': 'VAPID-ключи не заданы. См. README.',
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Настройки</h1>
    </div>

    <p class="hint">
      На iPhone и iPad push приходит только после установки дневника на домашний экран.
      В Safari без установки уведомления не придут. В продакшене нужен HTTPS.
    </p>

    <p class="muted">{{ statusText[status] }}</p>
    <p v-if="error" class="form-error">{{ error }}</p>

    <div class="inline-form" data-tour="parent-push">
      <button
        v-if="status !== 'on'"
        class="btn btn-primary"
        type="button"
        :disabled="busy || status === 'unsupported' || status === 'denied' || status === 'missing-key'"
        @click="enablePush"
      >
        Включить уведомления
      </button>
      <button
        v-else
        class="btn btn-ghost"
        type="button"
        :disabled="busy"
        @click="disablePush"
      >
        Отключить уведомления
      </button>
    </div>
  </section>
</template>
