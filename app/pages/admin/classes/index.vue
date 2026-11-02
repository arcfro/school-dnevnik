<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type Klass = {
  id: string
  name: string
  gradeLevel: string | null
  studentCount: number
}

const toast = useToast()
const { data: items, refresh, pending } = await useFetch<Klass[]>('/api/admin/classes')

const name = ref('')
const gradeLevel = ref('')
const saving = ref(false)

async function onCreate() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    toast.error('Укажите название класса')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/classes', {
      method: 'POST',
      body: { name: trimmed, gradeLevel: gradeLevel.value.trim() || undefined },
    })
    name.value = ''
    gradeLevel.value = ''
    await refresh()
    toast.success('Класс создан')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось создать класс'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Классы</h1>
    </div>

    <form class="inline-form" @submit.prevent="onCreate">
      <label class="field">
        Название
        <input v-model="name" required maxlength="80" placeholder="5А">
      </label>
      <label class="field">
        Параллель
        <input v-model="gradeLevel" maxlength="20" placeholder="5">
      </label>
      <button class="btn btn-primary" type="submit" :disabled="saving">
        {{ saving ? 'Сохраняем…' : 'Добавить' }}
      </button>
    </form>

    <p v-if="pending && !items?.length" class="muted">Загрузка…</p>
    <p v-else-if="!items?.length" class="muted">Классов пока нет.</p>
    <div v-else class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Класс</th>
          <th>Параллель</th>
          <th>Ученики</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="klass in items" :key="klass.id">
          <td>
            <NuxtLink :to="`/admin/classes/${klass.id}`">{{ klass.name }}</NuxtLink>
          </td>
          <td>{{ klass.gradeLevel || '—' }}</td>
          <td>{{ klass.studentCount }}</td>
        </tr>
      </tbody>
    </table>
    </div>
  </section>
</template>
