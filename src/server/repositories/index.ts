import { createInsforgeRepositories } from './insforge'
import { InMemoryLeadRepository, InMemoryTenantRepository } from './memory'
import type { LeadRepository, TenantRepository } from './types'

export const TENANT_DEMO_ID = 'despacho-demo'

/**
 * Único sitio que elige el adapter. Con las variables de InsForge, despacho y leads
 * viven en Postgres. Sin ellas, los tests siguen en memoria.
 */
export function createRepositories(): { leads: LeadRepository; tenants: TenantRepository } {
  const url = process.env.INSFORGE_URL
  const apiKey = process.env.INSFORGE_API_KEY
  if (url && apiKey) return createInsforgeRepositories(url, apiKey)
  return {
    leads: new InMemoryLeadRepository(),
    tenants: new InMemoryTenantRepository([{ id: TENANT_DEMO_ID, nombre: 'Despacho demo' }]),
  }
}

let activos: ReturnType<typeof createRepositories> | undefined

export function getRepositories() {
  if (!activos) activos = createRepositories()
  return activos
}
