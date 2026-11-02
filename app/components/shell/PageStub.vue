<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="page-stub">
    <h1>{{ title }}</h1>
  </section>
</template>
