<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<template>
  <div class="toast-region" aria-live="polite" aria-relevant="additions">
    <p
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="`toast-${toast.kind}`"
      role="status"
    >
      <span>{{ toast.message }}</span>
      <button class="toast-close" type="button" aria-label="Закрыть" @click="dismiss(toast.id)">
        ×
      </button>
    </p>
  </div>
</template>
