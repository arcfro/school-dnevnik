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

type JournalStudent = {
  id: string
  name: string
  grade: { id: string; value: string; type: string | null; comment: string | null } | null
  attendance: { id: string; status: AttendanceStatus } | null
}

type Journal = {
  assignments: Assignment[]
  classId: string | null
  className: string | null
  subjectId: string | null
  subjectName: string | null
  date: string | null
  students: JournalStudent[]
}

const toast = useToast()
const classSubject = ref('')
const date = ref(todayIso())
const drafts = ref<Record<string, { value: string; status: string }>>({})
const saving = ref(false)

const query = computed(() => {
  const [classId, subjectId] = classSubject.value.split(':')
  if (!classId || !subjectId || !date.value) return {}
  return { classId, subjectId, date: date.value }
})

const { data, error, pending, refresh } = await useFetch<Journal>('/api/teacher/journal', {
  query,
  watch: [query],
})

watch(
  () => data.value?.assignments,
  (list) => {
    if (!classSubject.value && list?.[0]) {
      classSubject.value = `${list[0].classId}:${list[0].subjectId}`
    }
  },
  { immediate: true },
)

watch(
  () => data.value?.students,
  (students) => {
    const next: Record<string, { value: string; status: string }> = {}
    for (const s of students ?? []) {
      next[s.id] = {
        value: s.grade?.value ?? '',
        status: s.attendance?.status ?? '',
      }
    }
    drafts.value = next
  },
  { immediate: true },
)

async function onSave() {
  const [classId, subjectId] = classSubject.value.split(':')
  if (!classId || !subjectId) return
  saving.value = true
  try {
    const entries = Object.entries(drafts.value).map(([studentId, row]) => ({
      studentId,
      value: row.value,
      status: row.status,
    }))
    await $fetch('/api/teacher/journal/grades', {
      method: 'POST',
      body: {
        classId,
        subjectId,
        date: date.value,
        entries: entries.map((e) => ({ studentId: e.studentId, value: e.value })),
      },
    })
    await $fetch('/api/teacher/journal/attendance', {
      method: 'POST',
      body: {
        classId,
        subjectId,
        date: date.value,
        entries: entries.map((e) => ({ studentId: e.studentId, status: e.status })),
      },
    })
    await refresh()
    toast.success('Журнал сохранён')
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось сохранить журнал'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Журнал</h1>
    </div>

    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить журнал') }}</p>
    <p v-else-if="pending && !data?.assignments.length" class="muted">Загрузка…</p>
    <p v-else-if="!data?.assignments.length" class="muted">Нет назначенных классов и предметов.</p>
    <template v-else>
      <div class="journal-toolbar">
        <label class="field">
          Класс и предмет
          <select v-model="classSubject">
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
          Дата
          <input v-model="date" type="date">
        </label>
        <button class="btn btn-primary" type="button" :disabled="saving || !data.students.length" @click="onSave">
          Сохранить
        </button>
      </div>

      <p v-if="pending && !data.students.length" class="muted">Загрузка…</p>
      <p v-else-if="!data.students.length" class="muted">В классе пока нет учеников.</p>
      <div v-else class="schedule-grid-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ученик</th>
              <th>Оценка</th>
              <th>Посещаемость</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in data.students" :key="student.id">
              <td>{{ student.name }}</td>
              <td>
                <input
                  v-model="drafts[student.id].value"
                  class="journal-grade"
                  maxlength="8"
                  placeholder="5"
                  :disabled="saving"
                >
              </td>
              <td>
                <select v-model="drafts[student.id].status" class="journal-status" :disabled="saving">
                  <option v-for="row in ATTENDANCE_STATUSES" :key="row.value || 'empty'" :value="row.value">
                    {{ row.label }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
