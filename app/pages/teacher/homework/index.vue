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

type HomeworkItem = {
  id: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  title: string
  body: string
  dueAt: string | null
  teacherName: string
  createdAt: string | Date
}

type TeacherHomework = {
  assignments: Assignment[]
  classId: string | null
  className: string | null
  items: HomeworkItem[]
}

const classId = ref('')
const query = computed(() => (classId.value ? { classId: classId.value } : {}))
const { data, error, pending } = await useFetch<TeacherHomework>('/api/teacher/homework', {
  query,
  watch: [query],
})

const classes = computed(() => {
  const seen = new Map<string, string>()
  for (const row of data.value?.assignments ?? []) {
    if (!seen.has(row.classId)) seen.set(row.classId, row.className)
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name }))
})

watch(
  () => data.value?.assignments,
  (list) => {
    if (classId.value || !list?.[0]) return
    classId.value = list[0].classId
  },
  { immediate: true },
)
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Задания</h1>
      <NuxtLink class="btn btn-primary" to="/teacher/homework/new">Новое задание</NuxtLink>
    </div>

    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить задания') }}</p>
    <p v-else-if="pending && !data?.assignments.length" class="muted">Загрузка…</p>
    <p v-else-if="!data?.assignments.length" class="muted">Нет назначенных классов и предметов.</p>
    <template v-else>
      <label class="field">
        Класс
        <select v-model="classId">
          <option v-for="klass in classes" :key="klass.id" :value="klass.id">
            {{ klass.name }}
          </option>
        </select>
      </label>

      <p v-if="!classId || (pending && !data.items.length)" class="muted">Загрузка…</p>
      <p v-else-if="!data.items.length" class="muted">Для этого класса заданий пока нет.</p>
      <div v-else class="schedule-grid-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Задание</th>
              <th>Срок</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data.items" :key="item.id">
              <td>{{ item.subjectName }}</td>
              <td>
                <strong>{{ item.title }}</strong>
                <p class="homework-body">{{ item.body }}</p>
              </td>
              <td>{{ homeworkDueLabel(item.dueAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
