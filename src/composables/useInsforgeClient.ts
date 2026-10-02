import { createClient, type InsForgeClient } from '@insforge/sdk'

let cliente: InsForgeClient | null = null

export function useInsforgeClient(): InsForgeClient {
  if (cliente) return cliente

  const config = useRuntimeConfig()
  const baseUrl = String(config.public.insforgeUrl || '')
  const anonKey = String(config.public.insforgeAnonKey || '')
  if (!baseUrl || !anonKey) {
    throw new Error('Falta la configuración pública de InsForge')
  }

  cliente = createClient({ baseUrl, anonKey })
  return cliente
}
