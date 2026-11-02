<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['admin'],
})
</script>

<template>
  <PageStub title="Задачи" />
</template>
