<script setup lang="ts">
definePageMeta({
  layout: 'parent',
  middleware: ['role'],
  roles: ['parent'],
})

const { data, error, pending, refresh } = await useParentNotifications()
const marking = ref<string | null>(null)

async function markRead(item: InAppNotification) {
  if (item.readAt || marking.value) return
  marking.value = item.id
  try {
    await $fetch(`/api/parent/notifications/${item.id}`, { method: 'PATCH' })
    await refresh()
  } catch (e) {
    console.error(e)
  } finally {
    marking.value = null
  }
}

async function openItem(item: InAppNotification) {
  await markRead(item)
  await navigateTo(notificationHref(item))
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Уведомления</h1>
      <p v-if="data" class="muted">
        {{ data.unreadCount ? `Непрочитанных: ${data.unreadCount}` : 'Все прочитаны' }}
      </p>
    </div>

    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить уведомления') }}</p>
    <p v-else-if="pending && !data" class="muted">Загрузка…</p>
    <p v-else-if="!data?.items.length" class="muted">Уведомлений пока нет.</p>
    <ul v-else class="notice-list">
      <li v-for="item in data.items" :key="item.id">
        <article class="notice-card" :class="{ 'is-unread': !item.readAt }">
          <button class="notice-main" type="button" @click="openItem(item)">
            <h2>{{ notificationTitle(item) }}</h2>
            <p class="muted">{{ notificationMeta(item) }}</p>
            <p class="muted">{{ formatDateTime(item.createdAt) }}</p>
          </button>
          <button
            v-if="!item.readAt"
            class="btn btn-ghost"
            type="button"
            :disabled="marking === item.id"
            @click="markRead(item)"
          >
            Прочитано
          </button>
        </article>
      </li>
    </ul>
  </section>
</template>
