<script setup lang="ts">
definePageMeta({
  layout: 'parent',
  middleware: ['role'],
  roles: ['parent'],
})

type Child = { id: string; name: string; classId: string; className: string }

type ParentSchedule = {
  children: Child[]
  studentId: string | null
  classId: string | null
  className: string | null
  slots: ScheduleSlot[]
}

const STORAGE_KEY = 'dnevnik:selected-student'
const studentId = ref('')

if (import.meta.client) {
  studentId.value = localStorage.getItem(STORAGE_KEY) ?? ''
}

const { data, error, pending, refresh } = await useFetch<ParentSchedule>('/api/parent/schedule', {
  query: computed(() => (studentId.value ? { studentId: studentId.value } : {})),
  watch: [studentId],
})

const cells = computed(() => slotsByCell(data.value?.slots))

function slotAt(day: number, lesson: number) {
  return cells.value.get(scheduleCellKey(day, lesson))
}

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
      <h1>Расписание</h1>
      <label v-if="(data?.children.length ?? 0) > 1" class="field child-switch">
        Ребёнок
        <select v-model="studentId">
          <option v-for="child in data?.children" :key="child.id" :value="child.id">
            {{ child.name }} · {{ child.className }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить расписание') }}</p>
    <p v-else-if="pending && !data" class="muted">Загрузка…</p>
    <p v-else-if="!data?.children.length" class="muted">Нет привязанных учеников.</p>
    <template v-else>
      <p v-if="data.className" class="muted">{{ data.className }}</p>
      <p v-if="!data.slots.length" class="muted">В сетке пока нет уроков.</p>
      <div v-else class="schedule-grid-wrap">
        <table class="schedule-grid">
          <thead>
            <tr>
              <th>Урок</th>
              <th v-for="day in WEEKDAYS" :key="day.value">{{ day.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lesson in LESSON_INDEXES" :key="lesson">
              <th>{{ lesson }}</th>
              <td v-for="day in WEEKDAYS" :key="`${day.value}:${lesson}`">
                <div v-if="slotAt(day.value, lesson)" class="schedule-slot">
                  <span class="schedule-slot-subject">{{ slotAt(day.value, lesson)!.subjectName }}</span>
                  <span class="schedule-slot-meta">
                    {{ slotAt(day.value, lesson)!.teacherName }}
                    <template v-if="slotAt(day.value, lesson)!.room">
                      · каб. {{ slotAt(day.value, lesson)!.room }}
                    </template>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
