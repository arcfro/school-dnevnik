<script setup lang="ts">
const props = defineProps<{
  links?: RoleNavLink[]
}>()

const route = useRoute()
const { user, clear, fetch: refreshSession } = useUserSession()
const pending = ref(false)
const menuOpen = ref(false)
const mobileNav = ref(false)

const navInert = computed(() => mobileNav.value && !menuOpen.value)

const links = computed(() => props.links ?? [])
const home = computed(() => (user.value ? roleHome[user.value.role] : '/login'))
const { resetAndStart } = useProductTour()

function isActive(link: RoleNavLink) {
  const path = route.path
  if (link.exact) return path === link.to
  return path === link.to || path.startsWith(`${link.to}/`)
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

watch(
  () => route.path,
  () => closeMenu(),
)

watch(menuOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

function onNavKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}

function syncMobileNav() {
  if (!import.meta.client) return
  mobileNav.value = window.matchMedia('(max-width: 48rem)').matches
  if (!mobileNav.value) closeMenu()
}

onMounted(() => {
  if (!import.meta.client) return
  closeMenu()
  syncMobileNav()
  window.matchMedia('(max-width: 48rem)').addEventListener('change', syncMobileNav)
  window.addEventListener('keydown', onNavKeydown)
})

onUnmounted(() => {
  if (!import.meta.client) return
  window.matchMedia('(max-width: 48rem)').removeEventListener('change', syncMobileNav)
  window.removeEventListener('keydown', onNavKeydown)
  document.body.style.overflow = ''
})

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
    <NuxtLink :to="home" class="brand" data-tour="app-brand">
      <AppLogo :size="26" />
      <span>Дневник</span>
    </NuxtLink>
    <button
      v-if="links.length"
      type="button"
      class="btn btn-ghost nav-toggle"
      :aria-expanded="menuOpen"
      aria-controls="app-nav"
      :aria-label="menuOpen ? 'Закрыть меню' : 'Открыть меню'"
      @click="toggleMenu"
    >
      <Icon :name="menuOpen ? 'lucide:x' : 'lucide:menu'" class="nav-toggle-icon" aria-hidden="true" />
    </button>
    <button
      v-if="links.length && menuOpen"
      type="button"
      class="nav-backdrop"
      tabindex="-1"
      aria-hidden="true"
      @click="closeMenu"
    />
    <nav
      v-if="links.length"
      id="app-nav"
      class="nav"
      :class="{ 'is-open': menuOpen }"
      :inert="navInert"
      aria-label="Разделы"
      data-tour="app-nav"
    >
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-link"
        :data-tour="tourNavAnchor(link.to)"
        :class="{ 'is-active': isActive(link) }"
        :aria-current="isActive(link) ? 'page' : undefined"
        @click="closeMenu"
      >
        <Icon v-if="link.icon" :name="link.icon" class="nav-icon" aria-hidden="true" />
        <span class="nav-label">{{ link.label }}</span>
        <span v-if="link.badge" class="nav-badge">{{ link.badge }}</span>
      </NuxtLink>
    </nav>
    <div v-if="user" class="session" data-tour="app-session">
      <button
        class="btn btn-ghost tour-help"
        type="button"
        title="Показать тур по приложению"
        aria-label="Показать тур по приложению"
        @click="resetAndStart()"
      >
        <Icon name="lucide:circle-help" class="tour-help-icon" aria-hidden="true" />
        <span class="tour-help-label">Тур</span>
      </button>
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
  padding: max(var(--space-md), env(safe-area-inset-top, 0px)) max(var(--space-xl), env(safe-area-inset-right, 0px))
    var(--space-md) max(var(--space-xl), env(safe-area-inset-left, 0px));
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
  gap: var(--space-md);
}

.nav-toggle {
  display: none;
  min-width: var(--touch-min);
  padding-inline: var(--space-md);
}

.nav-toggle-icon {
  width: var(--icon-md);
  height: var(--icon-md);
}

.nav-backdrop {
  display: none;
}

.nav {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.nav-icon {
  width: var(--icon-sm);
  height: var(--icon-sm);
  flex-shrink: 0;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
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
  margin-left: auto;
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

.tour-help {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-sm);
  padding-inline: var(--space-md);
}

.tour-help-icon {
  width: var(--icon-sm);
  height: var(--icon-sm);
  flex-shrink: 0;
}

@media (max-width: 48rem) {
  .app-header {
    --app-header-bar-height: calc(
      max(var(--space-md), env(safe-area-inset-top, 0px)) + var(--touch-min) + var(--space-md)
    );
    z-index: 10002;
    flex-wrap: nowrap;
    gap: var(--space-md);
  }

  .nav-toggle {
    display: inline-flex;
    margin-left: auto;
  }

  .nav-backdrop {
    display: block;
    position: fixed;
    top: var(--app-header-bar-height);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10000;
    border: 0;
    padding: 0;
    margin: 0;
    background: rgba(15, 23, 42, 0.45);
    cursor: default;
  }

  .nav {
    position: fixed;
    top: var(--app-header-bar-height);
    left: 0;
    bottom: 0;
    z-index: 10001;
    flex: none;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
    width: min(18rem, 88vw);
    margin: 0;
    padding: var(--space-lg) var(--space-lg) max(var(--space-xl), env(safe-area-inset-bottom, 0px));
    gap: var(--space-xs);
    overflow-y: auto;
    background: var(--color-card);
    border-right: 1px solid var(--color-border);
    box-shadow: var(--shadow-lg);
    transform: translateX(-105%);
    transition: transform var(--duration) var(--ease);
    visibility: hidden;
    pointer-events: none;
  }

  .nav.is-open {
    transform: translateX(0);
    visibility: visible;
    pointer-events: auto;
  }

  .nav-link {
    width: 100%;
    justify-content: flex-start;
  }

  .nav-link.is-active {
    box-shadow: inset 3px 0 0 var(--color-primary);
  }

  .session {
    flex-shrink: 0;
    gap: var(--space-sm);
    margin-left: 0;
  }

  .who {
    display: none;
  }

  .tour-help-label {
    display: none;
  }

  .tour-help {
    min-width: var(--touch-min);
    padding-inline: var(--space-md);
    justify-content: center;
  }

  .session .btn-ghost:not(.tour-help) {
    font-size: var(--text-sm);
    padding-inline: var(--space-md);
  }
}
</style>
