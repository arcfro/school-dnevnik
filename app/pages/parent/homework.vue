<script setup lang="ts">
definePageMeta({
  layout: 'parent',
  middleware: ['role'],
  roles: ['parent'],
})

type Child = { id: string; name: string; classId: string; className: string }

type HomeworkItem = {
  id: string
  subjectName: string
  title: string
  body: string
  dueAt: string | null
  teacherName: string
}

type ParentHomework = {
  children: Child[]
  studentId: string | null
  studentName: string | null
  className: string | null
  items: HomeworkItem[]
}

const STORAGE_KEY = 'dnevnik:selected-student'
const studentId = ref('')

if (import.meta.client) {
  studentId.value = localStorage.getItem(STORAGE_KEY) ?? ''
}

const { data, error, pending, refresh } = await useFetch<ParentHomework>('/api/parent/homework', {
  query: computed(() => (studentId.value ? { studentId: studentId.value } : {})),
  watch: [studentId],
})

watch(
  () => data.value?.studentId,
  (id) => {
    if (id && studentId.value !== id) studentId.value = id
  },
)

watch(studentId, (id) => {
  if (!import.meta.client) return
  if (id) localStorage.setItem(STORAGE_KEY, id)
  else localStorage.removeItem(STORAGE_KEY)
})

watch(error, async (err) => {
  const status = (err as { statusCode?: number } | null)?.statusCode
  if (status !== 403 || !studentId.value) return
  studentId.value = ''
  await refresh()
})

function dueChipClass(dueAt: string | null) {
  const tone = homeworkDueTone(dueAt)
  if (tone === 'overdue' || tone === 'today' || tone === 'soon') return `due-chip--${tone}`
  return undefined
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Задания</h1>
      <label v-if="(data?.children.length ?? 0) > 1" class="field child-switch">
        Ребёнок
        <select v-model="studentId">
          <option v-for="child in data?.children" :key="child.id" :value="child.id">
            {{ child.name }} · {{ child.className }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить задания') }}</p>
    <p v-else-if="pending && !data" class="muted">Загрузка…</p>
    <p v-else-if="!data?.children.length" class="muted">Нет привязанных учеников.</p>
    <template v-else>
      <p v-if="data.className" class="muted">{{ data.className }} · активные задания</p>
      <EmptyState
        v-if="!data.items.length"
        variant="homework"
        title="Активных заданий нет"
        description="Когда учитель выдаст домашку, она появится в этом списке."
      />
      <div v-else class="stack homework-list">
        <article v-for="item in data.items" :key="item.id" class="homework-card">
          <h2>{{ item.title }}</h2>
          <p class="muted homework-meta">
            {{ item.subjectName }}
            <span class="due-chip" :class="dueChipClass(item.dueAt)">{{ homeworkDueLabel(item.dueAt) }}</span>
            <template v-if="item.teacherName"> · {{ item.teacherName }}</template>
          </p>
          <p class="homework-body">{{ item.body }}</p>
        </article>
      </div>
    </template>
  </section>
</template>
