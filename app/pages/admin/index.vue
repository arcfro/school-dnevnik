<script setup lang="ts">
definePageMeta({
  middleware: ['role'],
  roles: ['admin'],
})
</script>

<template>
  <div>
    <h1>Админ</h1>
  </div>
</template>
