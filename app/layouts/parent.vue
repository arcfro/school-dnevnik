<script setup lang="ts">
const route = useRoute()
const { data, refresh } = await useParentNotifications()

const links = computed(() =>
  parentNav.map((link) =>
    link.to === '/parent/notifications'
      ? { ...link, badge: data.value?.unreadCount || undefined }
      : link,
  ),
)

watch(
  () => route.path,
  () => {
    void refresh()
  },
)
</script>

<template>
  <div class="shell">
    <AppHeader :links="links" />
    <main id="main" class="shell-main" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
