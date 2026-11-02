<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type JobRow = {
  id: string
  type: string
  status: string
  attempts: number
  runAt: string | Date
  lastError: string | null
  createdAt: string | Date
}

const { data: items, error, pending } = await useFetch<JobRow[]>('/api/admin/jobs')
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Задачи</h1>
    </div>

    <p class="muted">
      Очередь фоновых задач. Обработка:
      <code>POST /api/internal/jobs/process</code>
      с заголовком
      <code>X-Job-Secret</code>.
    </p>

    <p v-if="error" class="form-error">{{ apiErrorMessage(error, 'Не удалось загрузить задачи') }}</p>
    <p v-else-if="pending && !items" class="muted">Загрузка…</p>
    <p v-else-if="!items?.length" class="muted">Задач пока нет.</p>
    <div v-else class="schedule-grid-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Тип</th>
            <th>Статус</th>
            <th>Попытки</th>
            <th>Запуск</th>
            <th>Ошибка</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in items" :key="row.id">
            <td><code>{{ row.type }}</code></td>
            <td>{{ jobStatusLabel[row.status] ?? row.status }}</td>
            <td>{{ row.attempts }}</td>
            <td>{{ formatDateTime(row.runAt) }}</td>
            <td class="job-error">{{ row.lastError || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
