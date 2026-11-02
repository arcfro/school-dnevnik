<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)

async function onSubmit() {
  error.value = ''
  pending.value = true
  try {
    const user = await $fetch<{ role: keyof typeof roleHome }>('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await refreshSession()
    await navigateTo(roleHome[user.role])
  } catch {
    error.value = 'Неверный email или пароль'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="login-panel">
      <div class="login-brand">
        <AppLogo :size="36" />
        <h1>Вход</h1>
      </div>
      <form class="login-form" @submit.prevent="onSubmit">
        <label class="field">
          Email
          <input v-model="email" type="email" autocomplete="username" required>
        </label>
        <label class="field">
          Пароль
          <input v-model="password" type="password" autocomplete="current-password" required>
        </label>
        <p v-if="error" class="form-error">{{ error }}</p>
        <button class="btn btn-primary" type="submit" :disabled="pending">
          {{ pending ? 'Входим…' : 'Войти' }}
        </button>
      </form>
    </section>
    <aside class="login-aside" aria-hidden="true">
      <AppLogo :size="120" class="login-aside-art" />
      <h2 class="login-aside-title">Школьный дневник</h2>
      <p class="login-aside-desc">
        Расписание, оценки и задания — в одном месте для родителей, учителей и администрации.
      </p>
    </aside>
  </div>
</template>

<style scoped>
.login-brand {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
}

.login-brand h1 {
  margin: 0;
}

.login-form {
  display: grid;
  gap: var(--space-xl);
}

.login-aside-art {
  opacity: 0.9;
}
</style>
