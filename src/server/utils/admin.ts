import { createClient } from '@insforge/sdk'

export function emailsAdmin(rawLista?: string): string[] {
  const raw = rawLista ?? String(useRuntimeConfig().adminEmails || '')
  return raw
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

export async function exigirAdmin(event: Parameters<typeof getHeader>[0]) {
  const autorizacion = getHeader(event, 'authorization') || ''
  const token = autorizacion.startsWith('Bearer ') ? autorizacion.slice(7).trim() : ''
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesión' })
  }

  const config = useRuntimeConfig()
  const url = String(config.insforgeUrl || config.public.insforgeUrl || '')
  const anon = String(config.public.insforgeAnonKey || '')
  if (!url || !anon) {
    throw createError({ statusCode: 500, statusMessage: 'Auth no configurada' })
  }

  const cliente = createClient({ baseUrl: url, anonKey: anon })
  cliente.setAccessToken(token)
  const { data, error } = await cliente.auth.getCurrentUser()
  const email = (data.user?.email || '').toLowerCase()
  if (error || !email) {
    throw createError({ statusCode: 401, statusMessage: 'Sesión no válida' })
  }
  if (!emailsAdmin().includes(email)) {
    throw createError({ statusCode: 403, statusMessage: 'No tienes acceso de administrador' })
  }
  return { email, userId: data.user?.id || '' }
}

export function slugifyId(nombre: string, tipo: string): string {
  const base = `${tipo === 'notaria' ? 'no' : 'ab'}-${nombre}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return `${base || 'profesional'}-${crypto.randomUUID().slice(0, 8)}`
}
