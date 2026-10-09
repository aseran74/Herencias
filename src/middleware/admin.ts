import { useAuthStore } from '../stores/auth'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const auth = useAuthStore()
  await auth.hidratar()
  if (!auth.autenticado) {
    return navigateTo('/acceso?siguiente=/admin')
  }
  try {
    const { fetchAdmin } = await import('../composables/useAdminApi')
    await fetchAdmin('/api/admin/sesion')
  } catch {
    return abortNavigation(createError({ statusCode: 403, statusMessage: 'No tienes acceso de administrador' }))
  }
})
