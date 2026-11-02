<script setup lang="ts">
const { loggedIn, user } = useUserSession()
const homes = {
  admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
} as const
await navigateTo(
  loggedIn.value && user.value ? homes[user.value.role] : '/login',
  { redirectCode: 302 },
)
</script>
