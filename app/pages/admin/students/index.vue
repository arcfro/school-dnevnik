<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})

type Student = { id: string; name: string; classId: string; className: string }

const { data: items, pending } = await useFetch<Student[]>('/api/admin/students')
</script>

<template>
  <section class="page-card stack">
    <div class="page-head">
      <h1>Ученики</h1>
    </div>
    <p class="muted">Добавлять учеников нужно на странице класса.</p>
    <p v-if="pending && !items?.length" class="muted">Загрузка…</p>
    <p v-else-if="!items?.length" class="muted">Учеников пока нет.</p>
    <div v-else class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th>Имя</th>
          <th>Класс</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="student in items" :key="student.id">
          <td>{{ student.name }}</td>
          <td>
            <NuxtLink :to="`/admin/classes/${student.classId}`">{{ student.className }}</NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </section>
</template>
