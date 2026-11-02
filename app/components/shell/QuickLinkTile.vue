<script setup lang="ts">
defineProps<{
  to: string
  title: string
  description: string
  icon: string
  primary?: boolean
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="quick-tile"
    :class="{ 'quick-tile--primary': primary }"
  >
    <Icon :name="icon" class="quick-tile-icon" aria-hidden="true" />
    <span class="quick-tile-body">
      <span class="quick-tile-title">{{ title }}</span>
      <span class="quick-tile-desc">{{ description }}</span>
    </span>
    <Icon name="lucide:chevron-right" class="quick-tile-chevron" aria-hidden="true" />
  </NuxtLink>
</template>

<style scoped>
.quick-tile {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-xl);
  min-height: var(--touch-min);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-card);
  color: inherit;
  text-decoration: none;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease),
    transform var(--duration) var(--ease);
}

.quick-tile:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.quick-tile--primary {
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-card));
  border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
}

.quick-tile-icon {
  width: var(--icon-md);
  height: var(--icon-md);
  color: var(--color-primary);
  flex-shrink: 0;
}

.quick-tile-body {
  display: grid;
  gap: var(--space-xs);
  flex: 1;
  text-align: left;
}

.quick-tile-title {
  font-weight: 600;
}

.quick-tile-desc {
  font-size: var(--text-sm);
  color: var(--color-muted-foreground);
}

.quick-tile-chevron {
  width: var(--icon-sm);
  height: var(--icon-sm);
  color: var(--color-muted-foreground);
  flex-shrink: 0;
}
</style>
