<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['role'],
  roles: ['teacher'],
})

type Assignment = {
  classId: string
  className: string
  subjectId: string
  subjectName: string
}

type TeacherHomework = {
  assignments: Assignment[]
}

const route = useRoute()
const toast = useToast()
const classSubject = ref('')
const title = ref('')
const body = ref('')
const dueAt = ref('')
const saving = ref(false)

const { data, error, pending } = await useFetch<TeacherHomework>('/api/teacher/homework')

watch(
  () => data.value?.assignments,
  (list) => {
    if (classSubject.value || !list?.length) return
    const wantedClass = typeof route.query.classId === 'string' ? route.query.classId : ''
    const wantedSubject = typeof route.query.subjectId === 'string' ? route.query.subjectId : ''
    const match = list.find(
      (row) =>
        (!wantedClass || row.classId === wantedClass) &&
        (!wantedSubject || row.subjectId === wantedSubject),
    )
    const pick = match ?? list[0]
    classSubject.value = `${pick.classId}:${pick.subjectId}`
  },
  { immediate: true },
)

async function onCreate() {
  const [classId, subjectId] = classSubject.value.split(':')
  if (!classId || !subjectId) return
  saving.value = true
  try {
    await $fetch('/api/teacher/homework', {
      method: 'POST',
      body: {
        classId,
        subjectId,
        title: title.value,
        body: body.value,
        dueAt: dueAt.value || null,
      },
    })
    toast.success('Задание создано')
    await navigateTo('/teacher/homework')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось создать задание'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Новое задание</h1>
      <NuxtLink class="btn btn-ghost" to="/teacher/homework">К списку</NuxtLink>
    </div>

    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить назначения') }}</p>
    <p v-else-if="pending && !data" class="muted">Загрузка…</p>
    <p v-else-if="!data?.assignments.length" class="muted">Нет назначенных классов и предметов.</p>
    <form v-else class="homework-form" @submit.prevent="onCreate">
      <label class="field">
        Класс и предмет
        <select v-model="classSubject" required>
          <option
            v-for="row in data.assignments"
            :key="`${row.classId}:${row.subjectId}`"
            :value="`${row.classId}:${row.subjectId}`"
          >
            {{ row.className }} · {{ row.subjectName }}
          </option>
        </select>
      </label>
      <label class="field">
        Название
        <input v-model="title" required maxlength="160" placeholder="Параграф 12">
      </label>
      <label class="field">
        Текст
        <textarea v-model="body" required maxlength="4000" placeholder="Решить номера 1–5"></textarea>
      </label>
      <label class="field">
        Срок
        <input v-model="dueAt" type="date">
      </label>
      <button class="btn btn-primary" type="submit" :disabled="saving">
        {{ saving ? 'Сохраняем…' : 'Создать' }}
      </button>
    </form>
  </section>
</template>
