import { createAdminClient, type InsForgeClient } from '@insforge/sdk'
import type { Input, Resultado } from '../../domain/succession'
import type { ContactoLead } from '../schemas/lead'
import type { Lead, LeadNuevo, LeadRepository, Tenant, TenantRepository } from './types'

interface FilaLead {
  id: string
  despacho_id: string
  created_at: string
  nombre: string
  email: string
  telefono: string
  consentimiento_rgpd: boolean
  consentimiento_at: string
  input_json: Input
  resultado_json: Resultado
}

interface FilaDespacho {
  id: string
  nombre: string
}

export function createInsforgeRepositories(url: string, apiKey: string): {
  leads: LeadRepository
  tenants: TenantRepository
} {
  const cliente = createAdminClient({ baseUrl: url, apiKey })
  return {
    leads: new InsforgeLeadRepository(cliente),
    tenants: new InsforgeTenantRepository(cliente),
  }
}

class InsforgeLeadRepository implements LeadRepository {
  constructor(private readonly cliente: InsForgeClient) {}

  async save(lead: LeadNuevo): Promise<Lead> {
    const { data, error } = await this.cliente.database
      .from('leads')
      .insert([
        {
          despacho_id: lead.tenantId,
          nombre: lead.contacto.nombre,
          email: lead.contacto.email,
          telefono: lead.contacto.telefono,
          consentimiento_rgpd: lead.contacto.consentimiento_rgpd,
          estado_resultado: lead.resultado.estado,
          input_json: lead.input,
          resultado_json: lead.resultado,
        },
      ])
      .select('id, despacho_id, created_at, nombre, email, telefono, consentimiento_rgpd, consentimiento_at, input_json, resultado_json')
      .limit(1)

    const fila = primeraFila<FilaLead>(data)
    if (error || !fila) throw new Error('No se pudo guardar la consulta')
    return aLead(fila)
  }

  async findById(tenantId: string, id: string): Promise<Lead | null> {
    const { data, error } = await this.cliente.database
      .from('leads')
      .select('id, despacho_id, created_at, nombre, email, telefono, consentimiento_rgpd, consentimiento_at, input_json, resultado_json')
      .eq('id', id)
      .eq('despacho_id', tenantId)
      .limit(1)

    if (error) throw new Error('No se pudo leer la consulta')
    const fila = primeraFila<FilaLead>(data)
    return fila ? aLead(fila) : null
  }
}

class InsforgeTenantRepository implements TenantRepository {
  constructor(private readonly cliente: InsForgeClient) {}

  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.cliente.database
      .from('despachos')
      .select('id, nombre')
      .eq('id', id)
      .limit(1)

    if (error) throw new Error('No se pudo leer el despacho')
    const fila = primeraFila<FilaDespacho>(data)
    return fila ? { id: fila.id, nombre: fila.nombre } : null
  }
}

function aLead(fila: FilaLead): Lead {
  return {
    id: fila.id,
    tenantId: fila.despacho_id,
    createdAt: new Date(fila.created_at).toISOString(),
    consentimientoAt: new Date(fila.consentimiento_at).toISOString(),
    contacto: {
      nombre: fila.nombre,
      email: fila.email,
      telefono: fila.telefono,
      consentimiento_rgpd: fila.consentimiento_rgpd as true,
    },
    input: fila.input_json,
    resultado: fila.resultado_json,
  }
}

function primeraFila<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T | undefined) ?? null
  if (data && typeof data === 'object') return data as T
  return null
}
