export default defineNuxtRouteMiddleware((to) => {
  const { user } = useUserSession()
  const roles = to.meta.roles
  if (!roles?.length) return
  if (!user.value || !roles.includes(user.value.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
})
