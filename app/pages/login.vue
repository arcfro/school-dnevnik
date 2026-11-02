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
  <section class="login">
    <h1>Вход</h1>
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
</template>

<style scoped>
.login {
  max-width: 22rem;
  margin: var(--space-3xl) auto 0;
  padding: var(--space-2xl);
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.login-form {
  display: grid;
  gap: var(--space-xl);
  margin-top: var(--space-2xl);
}
</style>
