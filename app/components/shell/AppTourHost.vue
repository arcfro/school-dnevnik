<script setup lang="ts">
const route = useRoute()
const { maybeAutoStart } = useProductTour()

function tryAuto() {
  maybeAutoStart(route.path)
}

onMounted(() => {
  tryAuto()
})

watch(
  () => route.path,
  () => {
    tryAuto()
  },
)
</script>

<template>
  <span hidden aria-hidden="true" />
</template>
