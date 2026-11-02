<script setup lang="ts">
const props = defineProps<{
  links?: RoleNavLink[]
}>()

const route = useRoute()
const { user, clear, fetch: refreshSession } = useUserSession()
const pending = ref(false)

const links = computed(() => props.links ?? [])
const home = computed(() => (user.value ? roleHome[user.value.role] : '/login'))

function isActive(link: RoleNavLink) {
  const path = route.path
  if (link.exact) return path === link.to
  return path === link.to || path.startsWith(`${link.to}/`)
}

async function onLogout() {
  if (pending.value) return
  pending.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await refreshSession()
    await navigateTo('/login')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <header class="app-header">
    <a class="skip-link" href="#main">К содержимому</a>
    <NuxtLink :to="home" class="brand">Дневник</NuxtLink>
    <nav v-if="links.length" class="nav" aria-label="Разделы">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-link"
        :class="{ 'is-active': isActive(link) }"
        :aria-current="isActive(link) ? 'page' : undefined"
      >
        {{ link.label }}
        <span v-if="link.badge" class="nav-badge">{{ link.badge }}</span>
      </NuxtLink>
    </nav>
    <div v-if="user" class="session">
      <p class="who">
        <span class="who-name">{{ user.name }}</span>
        <span class="who-role">{{ roleLabel[user.role] }}</span>
      </p>
      <button class="btn btn-ghost" type="button" :disabled="pending" @click="onLogout">
        {{ pending ? 'Выходим…' : 'Выйти' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md) var(--space-xl);
  padding: var(--space-md) var(--space-xl);
  background: var(--color-card);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-foreground);
  text-decoration: none;
  min-height: var(--touch-min);
  display: inline-flex;
  align-items: center;
}

.nav {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--touch-min);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius);
  color: var(--color-muted-foreground);
  text-decoration: none;
  font-weight: 500;
  transition: background-color var(--duration) var(--ease),
    color var(--duration) var(--ease);
}

.nav-link:hover {
  background: var(--color-muted);
  color: var(--color-foreground);
}

.nav-link.is-active {
  color: var(--color-primary);
  background: var(--color-muted);
  box-shadow: inset 0 -2px 0 var(--color-primary);
}

.nav-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  margin-left: var(--space-sm);
  padding: 0 var(--space-sm);
  border-radius: 999px;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1;
}

.session {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-left: auto;
}

.who {
  display: grid;
  margin: 0;
  line-height: 1.2;
}

.who-name {
  font-weight: 600;
}

.who-role {
  color: var(--color-muted-foreground);
  font-size: var(--text-sm);
}

@media (max-width: 48rem) {
  .nav {
    flex: 1 0 100%;
    order: 1;
  }
}
</style>
