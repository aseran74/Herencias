import type { Lead, LeadNuevo, LeadRepository, Tenant, TenantRepository } from './types'

export class InMemoryLeadRepository implements LeadRepository {
  private readonly leads = new Map<string, Lead>()

  async save(lead: LeadNuevo): Promise<Lead> {
    const guardado: Lead = {
      ...structuredClone(lead),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      consentimientoAt: new Date().toISOString(),
    }
    this.leads.set(clave(guardado.tenantId, guardado.id), guardado)
    return structuredClone(guardado)
  }

  async findById(tenantId: string, id: string): Promise<Lead | null> {
    const lead = this.leads.get(clave(tenantId, id))
    return lead ? structuredClone(lead) : null
  }
}

export class InMemoryTenantRepository implements TenantRepository {
  private readonly tenants: Map<string, Tenant>

  constructor(tenants: readonly Tenant[]) {
    this.tenants = new Map(tenants.map((tenant) => [tenant.id, structuredClone(tenant)]))
  }

  async findById(id: string): Promise<Tenant | null> {
    const tenant = this.tenants.get(id)
    return tenant ? structuredClone(tenant) : null
  }
}

function clave(tenantId: string, id: string) {
  return `${tenantId}:${id}`
}
