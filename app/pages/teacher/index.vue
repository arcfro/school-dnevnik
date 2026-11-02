<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['role'],
  roles: ['teacher'],
})
</script>

<template>
  <PageStub title="Учитель" />
</template>
