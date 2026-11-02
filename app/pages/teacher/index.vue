<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['role'],
  roles: ['teacher'],
})

type TeacherSchedule = { slots: ScheduleSlot[] }

const { data, error, pending } = await useFetch<TeacherSchedule>('/api/teacher/schedule')
const cells = computed(() => slotsByCell(data.value?.slots))

function slotAt(day: number, lesson: number) {
  return cells.value.get(scheduleCellKey(day, lesson))
}
</script>

<template>
  <section class="page-card stack" data-tour="teacher-schedule">
    <div class="page-head">
      <h1>Расписание</h1>
    </div>
    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить расписание') }}</p>
    <p v-else-if="pending && !data" class="muted">Загрузка…</p>
    <EmptyState
      v-else-if="!data?.slots.length"
      variant="schedule"
      title="Пока нет уроков в сетке"
      description="Когда администратор заполнит расписание, уроки появятся здесь."
    />
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
              <ScheduleSlotCard
                v-if="slotAt(day.value, lesson)"
                :slot="slotAt(day.value, lesson)!"
                :meta-line="
                  [
                    slotAt(day.value, lesson)!.className,
                    slotAt(day.value, lesson)!.room ? `каб. ${slotAt(day.value, lesson)!.room}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
