import type { Input, Resultado } from '../../domain/succession'
import type { ContactoLead } from '../schemas/lead'

export interface Lead {
  id: string
  tenantId: string
  createdAt: string
  consentimientoAt: string
  contacto: ContactoLead
  input: Input
  resultado: Resultado
  citaExpress: boolean
  notaExpress: string
  grabacionUrl: string | null
  grabacionKey: string | null
}

export interface LeadNuevo {
  tenantId: string
  contacto: ContactoLead
  input: Input
  resultado: Resultado
  citaExpress?: boolean
  notaExpress?: string
  grabacionUrl?: string | null
  grabacionKey?: string | null
}

export interface LeadRepository {
  save(lead: LeadNuevo): Promise<Lead>
  findById(tenantId: string, id: string): Promise<Lead | null>
}

export interface Tenant {
  id: string
  nombre: string
}

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>
}
