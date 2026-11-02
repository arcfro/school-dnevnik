<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'schedule' | 'homework' | 'grades' | 'generic'
    title: string
    description?: string
  }>(),
  { variant: 'generic' },
)
</script>

<template>
  <div class="empty-state">
    <svg class="empty-state-art" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="var(--color-muted)" />
      <g v-if="variant === 'schedule'" fill="var(--color-primary)">
        <rect x="28" y="32" width="64" height="8" rx="2" opacity="0.35" />
        <rect x="28" y="48" width="44" height="6" rx="2" opacity="0.5" />
        <rect x="28" y="62" width="52" height="6" rx="2" opacity="0.5" />
        <rect x="28" y="76" width="36" height="6" rx="2" opacity="0.5" />
        <rect x="72" y="44" width="20" height="44" rx="3" />
      </g>
      <g v-else-if="variant === 'homework'" fill="var(--color-primary)">
        <path d="M36 28h36l16 16v48a4 4 0 0 1-4 4H36a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4Z" opacity="0.35" />
        <path d="M40 28h32l12 12v48a4 4 0 0 1-4 4H40V28Z" />
        <path d="M72 28v12h12" fill="none" stroke="var(--color-card)" stroke-width="2" />
      </g>
      <g v-else-if="variant === 'grades'" fill="var(--color-accent)">
        <path
          d="M60 34l8.2 16.6 18.3 2.7-13.3 13 3.1 18.2L60 76.4 43.7 84.5l3.1-18.2-13.3-13 18.3-2.7L60 34Z"
        />
      </g>
      <g v-else fill="var(--color-primary)" opacity="0.85">
        <circle cx="60" cy="60" r="22" fill="none" stroke="currentColor" stroke-width="4" />
        <path d="M60 44v18l12 7" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
      </g>
    </svg>
    <div class="empty-state-text">
      <p class="empty-state-title">{{ title }}</p>
      <p v-if="description" class="empty-state-desc">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="empty-state-actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: grid;
  justify-items: center;
  gap: var(--space-xl);
  padding: var(--space-2xl) var(--space-xl);
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-muted) 45%, transparent);
}

.empty-state-art {
  width: 7rem;
  height: 7rem;
}

.empty-state-title {
  margin: 0;
  font-weight: 600;
  font-size: var(--text-lg);
}

.empty-state-desc {
  margin: var(--space-sm) 0 0;
  color: var(--color-muted-foreground);
  max-width: 28rem;
}
</style>
