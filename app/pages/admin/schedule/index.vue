<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type Klass = {
  id: string
  name: string
  gradeLevel: string | null
  studentCount: number
}

const { data: items, pending } = await useFetch<Klass[]>('/api/admin/classes')
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Расписание</h1>
    </div>
    <p v-if="pending && !items?.length" class="muted">Загрузка…</p>
    <p v-else-if="!items?.length" class="muted">Сначала создайте класс.</p>
    <div v-else class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Класс</th>
          <th>Параллель</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="klass in items" :key="klass.id">
          <td>
            <NuxtLink :to="`/admin/schedule/${klass.id}`">{{ klass.name }}</NuxtLink>
          </td>
          <td>{{ klass.gradeLevel || '—' }}</td>
        </tr>
      </tbody>
    </table>
    </div>
  </section>
</template>
