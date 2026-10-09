import { useInsforgeClient } from './useInsforgeClient'

async function tokenAdmin(): Promise<string> {
  const cliente = useInsforgeClient()
  const token = await cliente.getHttpClient().getValidAccessToken()
  if (!token) throw new Error('Debes iniciar sesión')
  return token
}

export async function fetchAdmin<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await tokenAdmin()
  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  return $fetch<T>(path, { ...init, headers })
}
