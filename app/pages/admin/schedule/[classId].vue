<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type Assignment = {
  id: string
  subjectId: string
  teacherUserId: string
  subjectName: string
  teacherName: string
}

type ClassSchedule = {
  classId: string
  className: string
  slots: ScheduleSlot[]
}

const route = useRoute()
const toast = useToast()
const classId = computed(() => String(route.params.classId))
const pendingCell = ref('')

const { data: schedule, error: scheduleError, refresh } = await useFetch<ClassSchedule>(
  () => '/api/admin/schedule',
  { query: { classId } },
)
const { data: assignments } = await useFetch<Assignment[]>(
  () => '/api/admin/class-subjects',
  { query: { classId } },
)

const cells = computed(() => slotsByCell(schedule.value?.slots))

function slotAt(day: number, lesson: number) {
  return cells.value.get(scheduleCellKey(day, lesson))
}

function assignmentFor(subjectId: string) {
  return assignments.value?.find((a) => a.subjectId === subjectId)
}

async function saveSlot(dayOfWeek: number, lessonIndex: number, subjectId: string, room: string) {
  const key = scheduleCellKey(dayOfWeek, lessonIndex)
  const current = cells.value.get(key)
  pendingCell.value = key
  try {
    if (!subjectId) {
      if (current) {
        await $fetch(`/api/admin/schedule/${current.id}`, { method: 'DELETE' })
        toast.success('Урок снят')
      }
    } else {
      const assignment = assignmentFor(subjectId)
      if (!assignment) {
        toast.error('Предмет не назначен классу')
        return
      }
      await $fetch('/api/admin/schedule', {
        method: 'POST',
        body: {
          classId: classId.value,
          dayOfWeek,
          lessonIndex,
          subjectId: assignment.subjectId,
          teacherUserId: assignment.teacherUserId,
          room: room.trim() || undefined,
        },
      })
      toast.success('Урок сохранён')
    }
    await refresh()
  } catch (e) {
    toast.error(apiErrorMessage(e, 'Не удалось сохранить урок'))
  } finally {
    pendingCell.value = ''
  }
}

async function onSubject(dayOfWeek: number, lessonIndex: number, event: Event) {
  const subjectId = (event.target as HTMLSelectElement).value
  const current = cells.value.get(scheduleCellKey(dayOfWeek, lessonIndex))
  await saveSlot(dayOfWeek, lessonIndex, subjectId, current?.room ?? '')
}

async function onRoom(dayOfWeek: number, lessonIndex: number, event: Event) {
  const room = (event.target as HTMLInputElement).value
  const current = cells.value.get(scheduleCellKey(dayOfWeek, lessonIndex))
  if (!current) return
  await saveSlot(dayOfWeek, lessonIndex, current.subjectId, room)
}
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <div>
        <p class="muted">
          <NuxtLink to="/admin/schedule">← Расписание</NuxtLink>
        </p>
        <h1>{{ schedule?.className || 'Расписание' }}</h1>
      </div>
    </div>

    <p v-if="scheduleError" class="form-error">
      {{ apiErrorMessage(scheduleError, 'Не удалось загрузить расписание') }}
    </p>
    <p v-else-if="!assignments?.length" class="muted">
      Сначала назначьте предметы классу на странице
      <NuxtLink :to="`/admin/classes/${classId}`">класса</NuxtLink>.
    </p>
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
              <div class="schedule-cell">
                <select
                  :key="slotAt(day.value, lesson)?.id ?? `empty-${day.value}-${lesson}`"
                  :value="slotAt(day.value, lesson)?.subjectId ?? ''"
                  :disabled="pendingCell === scheduleCellKey(day.value, lesson)"
                  @change="onSubject(day.value, lesson, $event)"
                >
                  <option value="">—</option>
                  <option
                    v-for="row in assignments"
                    :key="row.subjectId"
                    :value="row.subjectId"
                  >
                    {{ row.subjectName }}
                  </option>
                </select>
                <input
                  :value="slotAt(day.value, lesson)?.room ?? ''"
                  :disabled="!slotAt(day.value, lesson) || pendingCell === scheduleCellKey(day.value, lesson)"
                  maxlength="20"
                  placeholder="каб."
                  @change="onRoom(day.value, lesson, $event)"
                >
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
