const ROLE_HOME = {
  admin: '/admin',
  teacher: '/teacher',
  parent: '/parent',
} as const

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn, user } = useUserSession()
  const publicPaths = new Set(['/login'])

  if (publicPaths.has(to.path)) {
    if (loggedIn.value && user.value) {
      return navigateTo(ROLE_HOME[user.value.role])
    }
    return
  }

  if (!loggedIn.value || !user.value) {
    return navigateTo('/login')
  }

  if (to.path === '/') {
    return navigateTo(ROLE_HOME[user.value.role])
  }
})
