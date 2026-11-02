<script setup lang="ts">
const props = defineProps<{
  slot: ScheduleSlot
  metaLine?: string
}>()

const style = computed(() => subjectColorVars(props.slot.subjectId))
</script>

<template>
  <div class="schedule-slot" :style="style">
    <span class="schedule-slot-subject">{{ slot.subjectName }}</span>
    <span v-if="metaLine" class="schedule-slot-meta">{{ metaLine }}</span>
  </div>
</template>
