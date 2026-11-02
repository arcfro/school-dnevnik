<script setup lang="ts">
definePageMeta({
  layout: false,
})

const { loggedIn, user } = useUserSession()
await navigateTo(
  loggedIn.value && user.value ? roleHome[user.value.role] : '/login',
  { redirectCode: 302 },
)
</script>
