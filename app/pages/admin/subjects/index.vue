<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type Subject = { id: string; name: string }

const toast = useToast()
const { data: items, refresh, pending } = await useFetch<Subject[]>('/api/admin/subjects')

const name = ref('')
const saving = ref(false)

async function onCreate() {
  const trimmed = name.value.trim()
  if (!trimmed) {
    toast.error('Укажите название предмета')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/subjects', {
      method: 'POST',
      body: { name: trimmed },
    })
    name.value = ''
    await refresh()
    toast.success('Предмет создан')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось создать предмет'))
  } finally {
    saving.value = false
  }
}

async function onDelete(id: string, subjectName: string) {
  if (!confirm(`Удалить предмет «${subjectName}»?`)) return
  try {
    await $fetch(`/api/admin/subjects/${id}`, { method: 'DELETE' })
    await refresh()
    toast.success('Предмет удалён')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось удалить предмет'))
  }
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Предметы</h1>
    </div>

    <form class="inline-form" @submit.prevent="onCreate">
      <label class="field">
        Название
        <input v-model="name" required maxlength="80" placeholder="Математика">
      </label>
      <button class="btn btn-primary" type="submit" :disabled="saving">
        {{ saving ? 'Сохраняем…' : 'Добавить' }}
      </button>
    </form>

    <p v-if="pending && !items?.length" class="muted">Загрузка…</p>
    <p v-else-if="!items?.length" class="muted">Предметов пока нет.</p>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Предмет</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="subject in items" :key="subject.id">
          <td>{{ subject.name }}</td>
          <td>
            <button class="btn btn-danger" type="button" @click="onDelete(subject.id, subject.name)">
              Удалить
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
