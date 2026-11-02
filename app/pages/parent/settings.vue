<script setup lang="ts">
definePageMeta({
  layout: 'parent',
  middleware: ['role'],
  roles: ['parent'],
})
</script>

<template>
  <PageStub title="Настройки" />
</template>
