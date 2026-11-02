<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type AdminUser = {
  id: string
  email: string
  role: 'admin' | 'teacher' | 'parent'
  name: string
}

const toast = useToast()
const { data: items, refresh, pending } = await useFetch<AdminUser[]>('/api/admin/users')

const name = ref('')
const email = ref('')
const password = ref('')
const role = ref<'teacher' | 'parent' | 'admin'>('parent')
const saving = ref(false)

async function onCreate() {
  const trimmedName = name.value.trim()
  const trimmedEmail = email.value.trim()
  if (!trimmedName) {
    toast.error('Укажите имя')
    return
  }
  if (!trimmedEmail) {
    toast.error('Укажите email')
    return
  }
  if (password.value.length < 6) {
    toast.error('Пароль минимум 6 символов')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        name: trimmedName,
        email: trimmedEmail,
        password: password.value,
        role: role.value,
      },
    })
    name.value = ''
    email.value = ''
    password.value = ''
    await refresh()
    toast.success('Пользователь создан')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось создать пользователя'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Пользователи</h1>
    </div>

    <form class="inline-form" @submit.prevent="onCreate">
      <label class="field">
        Имя
        <input v-model="name" required maxlength="120" placeholder="Петров Пётр">
      </label>
      <label class="field">
        Email
        <input v-model="email" type="email" required maxlength="160" placeholder="parent@school.local">
      </label>
      <label class="field">
        Пароль
        <input v-model="password" type="password" required minlength="6" maxlength="80" autocomplete="new-password">
      </label>
      <label class="field">
        Роль
        <select v-model="role" required>
          <option value="parent">Родитель</option>
          <option value="teacher">Учитель</option>
          <option value="admin">Админ</option>
        </select>
      </label>
      <button class="btn btn-primary" type="submit" :disabled="saving">
        {{ saving ? 'Сохраняем…' : 'Добавить' }}
      </button>
    </form>

    <p class="muted">Детей к родителю привязывают в карточке пользователя.</p>
    <p v-if="pending && !items?.length" class="muted">Загрузка…</p>
    <p v-else-if="!items?.length" class="muted">Пользователей пока нет.</p>
    <div v-else class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Имя</th>
          <th>Email</th>
          <th>Роль</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in items" :key="row.id">
          <td>
            <NuxtLink :to="`/admin/users/${row.id}`">{{ row.name }}</NuxtLink>
          </td>
          <td>{{ row.email }}</td>
          <td>{{ roleLabel[row.role] }}</td>
        </tr>
      </tbody>
    </table>
    </div>
  </section>
</template>
