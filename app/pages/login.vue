<script setup lang="ts">
const { fetch: refreshSession } = useUserSession()

const email = ref('')
const password = ref('')
const error = ref('')
const pending = ref(false)

const homes = {
  admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
} as const

async function onSubmit() {
  error.value = ''
  pending.value = true
  try {
    const user = await $fetch<{ role: keyof typeof homes }>('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await refreshSession()
    await navigateTo(homes[user.role])
  } catch {
    error.value = 'Неверный email или пароль'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="login">
    <h1>Вход</h1>
    <form @submit.prevent="onSubmit">
      <label>
        Email
        <input v-model="email" type="email" autocomplete="username" required>
      </label>
      <label>
        Пароль
        <input v-model="password" type="password" autocomplete="current-password" required>
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" :disabled="pending">
        {{ pending ? 'Входим…' : 'Войти' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login {
  max-width: 22rem;
  margin: 4rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
}
form {
  display: grid;
  gap: 0.75rem;
}
label {
  display: grid;
  gap: 0.25rem;
}
input,
button {
  padding: 0.5rem 0.6rem;
}
.error {
  color: #b42318;
  margin: 0;
}
</style>
