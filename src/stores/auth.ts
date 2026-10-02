import type { UserSchema } from '@insforge/sdk'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useInsforgeClient } from '../composables/useInsforgeClient'

function mensaje(error: { message?: string } | null, fallback: string): string {
  return error?.message || fallback
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserSchema | null>(null)
  const cargando = ref(true)
  const error = ref('')
  let hidratacion: Promise<void> | null = null

  const autenticado = computed(() => Boolean(user.value))
  const nombre = computed(() => user.value?.profile?.name || user.value?.email || 'Mi perfil')
  const avatar = computed(() => user.value?.profile?.avatar_url || '')

  async function hidratar() {
    if (hidratacion) return hidratacion
    hidratacion = (async () => {
      cargando.value = true
      error.value = ''
      const cliente = useInsforgeClient()
      cliente.auth.onAuthStateChange(() => {
        void refrescar()
      })
      await refrescar()
    })()
    return hidratacion
  }

  async function refrescar() {
    cargando.value = true
    const { data, error: authError } = await useInsforgeClient().auth.getCurrentUser()
    user.value = data.user
    if (authError) error.value = mensaje(authError, 'No se pudo recuperar la sesión')
    cargando.value = false
  }

  async function acceder(email: string, password: string): Promise<boolean> {
    error.value = ''
    cargando.value = true
    const { data, error: authError } = await useInsforgeClient().auth.signInWithPassword({ email, password })
    user.value = data?.user ?? null
    cargando.value = false
    if (authError) {
      error.value = mensaje(authError, 'No se pudo iniciar sesión')
      return false
    }
    return Boolean(user.value)
  }

  async function registrar(nombreUsuario: string, email: string, password: string): Promise<'verificar' | 'acceso' | 'error'> {
    error.value = ''
    cargando.value = true
    const { data, error: authError } = await useInsforgeClient().auth.signUp({
      name: nombreUsuario,
      email,
      password,
    })
    cargando.value = false
    if (authError || !data) {
      error.value = mensaje(authError, 'No se pudo crear la cuenta')
      return 'error'
    }
    if (data.requireEmailVerification) return 'verificar'
    user.value = data.user ?? null
    return user.value ? 'acceso' : 'error'
  }

  async function verificar(email: string, otp: string): Promise<boolean> {
    error.value = ''
    cargando.value = true
    const { data, error: authError } = await useInsforgeClient().auth.verifyEmail({ email, otp })
    user.value = data?.user ?? null
    cargando.value = false
    if (authError) {
      error.value = mensaje(authError, 'El código no es válido o ha caducado')
      return false
    }
    return Boolean(user.value)
  }

  async function accederConGoogle() {
    error.value = ''
    const { error: authError } = await useInsforgeClient().auth.signInWithOAuth('google', {
      redirectTo: `${window.location.origin}/`,
      additionalParams: { prompt: 'select_account' },
    })
    if (authError) error.value = mensaje(authError, 'No se pudo abrir el acceso con Google')
  }

  async function actualizarNombre(nuevoNombre: string): Promise<boolean> {
    error.value = ''
    const { data, error: authError } = await useInsforgeClient().auth.setProfile({ name: nuevoNombre.trim() })
    if (authError || !data || !user.value) {
      error.value = mensaje(authError, 'No se pudo actualizar el perfil')
      return false
    }
    user.value = { ...user.value, profile: { ...user.value.profile, ...data } }
    return true
  }

  async function cerrarSesion() {
    error.value = ''
    const { error: authError } = await useInsforgeClient().auth.signOut()
    if (authError) {
      error.value = mensaje(authError, 'No se pudo cerrar la sesión')
      return
    }
    user.value = null
    await navigateTo('/')
  }

  return {
    user, cargando, error, autenticado, nombre, avatar,
    hidratar, refrescar, acceder, registrar, verificar,
    accederConGoogle, actualizarNombre, cerrarSesion,
  }
})
