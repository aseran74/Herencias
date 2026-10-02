/**
 * @vitest-environment happy-dom
 */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './auth'

const usuario = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'ana@example.com',
  emailVerified: true,
  providers: ['email'],
  createdAt: '2026-10-02T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
  profile: { name: 'Ana', avatar_url: null },
  metadata: {},
}

const authCliente = {
  onAuthStateChange: vi.fn(),
  getCurrentUser: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  verifyEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  setProfile: vi.fn(),
  signOut: vi.fn(),
}

vi.mock('../composables/useInsforgeClient', () => ({
  useInsforgeClient: () => ({ auth: authCliente }),
}))

describe('sesión de usuario', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    authCliente.getCurrentUser.mockResolvedValue({ data: { user: null }, error: null })
  })

  it('hidrata una sesión anónima sin marcar acceso', async () => {
    const auth = useAuthStore()
    await auth.hidratar()
    expect(auth.autenticado).toBe(false)
    expect(auth.cargando).toBe(false)
  })

  it('inicia sesión con correo y expone el perfil', async () => {
    authCliente.signInWithPassword.mockResolvedValue({ data: { user: usuario }, error: null })
    const auth = useAuthStore()
    expect(await auth.acceder('ana@example.com', 'secreto')).toBe(true)
    expect(auth.autenticado).toBe(true)
    expect(auth.nombre).toBe('Ana')
  })
})
