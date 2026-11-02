<script setup lang="ts">
definePageMeta({
  layout: 'parent',
  middleware: ['role'],
  roles: ['parent'],
})

type Child = { id: string; name: string; classId: string; className: string }

type GradeRow = {
  id: string
  date: string
  subjectId: string
  subjectName: string
  value: string
  type: string | null
  comment: string | null
  teacherName: string
}

type AttendanceRow = {
  id: string
  date: string
  subjectId: string | null
  subjectName: string
  status: AttendanceStatus
}

type ParentGrades = {
  children: Child[]
  studentId: string | null
  studentName: string | null
  className: string | null
  from: string
  to: string
  grades: GradeRow[]
  attendance: AttendanceRow[]
}

const STORAGE_KEY = 'dnevnik:selected-student'
const studentId = ref('')

if (import.meta.client) {
  studentId.value = localStorage.getItem(STORAGE_KEY) ?? ''
}

const { data, error, pending, refresh } = await useFetch<ParentGrades>('/api/parent/grades', {
  query: computed(() => (studentId.value ? { studentId: studentId.value } : {})),
  watch: [studentId],
})

const rows = computed(() => {
  const map = new Map<
    string,
    { date: string; subjectName: string; value: string | null; comment: string | null; status: string | null }
  >()
  for (const grade of data.value?.grades ?? []) {
    map.set(`${grade.date}:${grade.subjectId}`, {
      date: grade.date,
      subjectName: grade.subjectName,
      value: grade.value,
      comment: grade.comment,
      status: null,
    })
  }
  for (const mark of data.value?.attendance ?? []) {
    const key = `${mark.date}:${mark.subjectId ?? ''}`
    const existing = map.get(key) ?? {
      date: mark.date,
      subjectName: mark.subjectName,
      value: null,
      comment: null,
      status: null,
    }
    existing.status = mark.status
    map.set(key, existing)
  }
  return [...map.values()].sort(
    (a, b) => b.date.localeCompare(a.date) || a.subjectName.localeCompare(b.subjectName, 'ru'),
  )
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
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Оценки</h1>
      <label v-if="(data?.children.length ?? 0) > 1" class="field child-switch">
        Ребёнок
        <select v-model="studentId">
          <option v-for="child in data?.children" :key="child.id" :value="child.id">
            {{ child.name }} · {{ child.className }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить оценки') }}</p>
    <p v-else-if="pending && !data" class="muted">Загрузка…</p>
    <p v-else-if="!data?.children.length" class="muted">Нет привязанных учеников.</p>
    <template v-else>
      <p class="muted">
        {{ data.className }}
        · последние 30 дней
        ({{ data.from }} — {{ data.to }})
      </p>
      <EmptyState
        v-if="!rows.length"
        variant="grades"
        title="За эти дни оценок и отметок нет"
      />
      <div v-else class="schedule-grid-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Предмет</th>
              <th>Оценка</th>
              <th>Посещаемость</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="`${row.date}:${row.subjectName}`">
              <td>{{ row.date }}</td>
              <td>{{ row.subjectName }}</td>
              <td>
                <span
                  v-if="row.value"
                  class="grade-pill"
                  :class="`grade-pill--${gradeTone(row.value)}`"
                >{{ row.value }}</span>
                <span v-else class="muted">—</span>
                <span v-if="row.comment" class="muted"> · {{ row.comment }}</span>
              </td>
              <td>
                <span :class="attendanceBadgeClass(row.status)">
                  {{ attendanceLabel(row.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
