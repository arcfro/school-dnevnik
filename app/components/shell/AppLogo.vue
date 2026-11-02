<script setup lang="ts">
defineProps<{
  size?: number
}>()
</script>

<template>
  <svg
    class="app-logo"
    :width="size ?? 28"
    :height="size ?? 28"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="4" y="3" width="22" height="26" rx="3" fill="currentColor" opacity="0.12" />
    <path
      d="M8 6h14a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H8V6Z"
      fill="currentColor"
      opacity="0.35"
    />
    <path
      d="M10 6h12a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H10V6Z"
      fill="currentColor"
    />
    <path d="M14 6v22" stroke="var(--color-background, #eef2ff)" stroke-width="1.5" />
    <path
      d="M22 4l3 2v20l-3 2V4Z"
      fill="var(--color-accent, #ea580c)"
    />
  </svg>
</template>

<style scoped>
.app-logo {
  flex-shrink: 0;
  color: var(--color-primary);
}
</style>
