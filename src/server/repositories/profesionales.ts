import { createAdminClient, type InsForgeClient } from '@insforge/sdk'
import type { Profesional, TipoProfesional } from '../../domain/profesionales'

interface FilaProfesional {
  id: string
  nombre: string
  tipo: TipoProfesional
  localidad: string
  provincia: string
  telefono: string
  email: string
  activo: boolean
  created_at?: string
}

function aProfesional(fila: FilaProfesional): Profesional {
  return {
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    localidad: fila.localidad,
    provincia: fila.provincia,
    telefono: fila.telefono || '',
    email: fila.email || '',
    activo: Boolean(fila.activo),
    createdAt: fila.created_at,
  }
}

function primeraFila<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T) ?? null
  if (data && typeof data === 'object') return data as T
  return null
}

export function createProfesionalesRepository(url: string, apiKey: string) {
  const cliente = createAdminClient({ baseUrl: url, apiKey })
  return new ProfesionalesRepository(cliente)
}

export class ProfesionalesRepository {
  constructor(private readonly cliente: InsForgeClient) {}

  async listar(filtros: { tipo?: TipoProfesional; provincia?: string; soloActivos?: boolean } = {}): Promise<Profesional[]> {
    let consulta = this.cliente.database
      .from('profesionales')
      .select('id, nombre, tipo, localidad, provincia, telefono, email, activo, created_at')
      .order('provincia', { ascending: true })
      .order('localidad', { ascending: true })
      .order('nombre', { ascending: true })

    if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo)
    if (filtros.provincia) consulta = consulta.eq('provincia', filtros.provincia)
    if (filtros.soloActivos !== false) consulta = consulta.eq('activo', true)

    const { data, error } = await consulta
    if (error) throw new Error('No se pudieron leer los profesionales')
    return (Array.isArray(data) ? data : []).map(fila => aProfesional(fila as FilaProfesional))
  }

  async guardar(profesional: Omit<Profesional, 'createdAt'>): Promise<Profesional> {
    const { data, error } = await this.cliente.database
      .from('profesionales')
      .upsert([{
        id: profesional.id,
        nombre: profesional.nombre,
        tipo: profesional.tipo,
        localidad: profesional.localidad,
        provincia: profesional.provincia,
        telefono: profesional.telefono,
        email: profesional.email,
        activo: profesional.activo,
      }])
      .select('id, nombre, tipo, localidad, provincia, telefono, email, activo, created_at')
      .limit(1)

    const fila = primeraFila<FilaProfesional>(data)
    if (error || !fila) throw new Error('No se pudo guardar el profesional')
    return aProfesional(fila)
  }

  async actualizar(id: string, cambios: Partial<Omit<Profesional, 'id' | 'createdAt'>>): Promise<Profesional> {
    const payload: Record<string, unknown> = {}
    if (cambios.nombre !== undefined) payload.nombre = cambios.nombre
    if (cambios.tipo !== undefined) payload.tipo = cambios.tipo
    if (cambios.localidad !== undefined) payload.localidad = cambios.localidad
    if (cambios.provincia !== undefined) payload.provincia = cambios.provincia
    if (cambios.telefono !== undefined) payload.telefono = cambios.telefono
    if (cambios.email !== undefined) payload.email = cambios.email
    if (cambios.activo !== undefined) payload.activo = cambios.activo

    const { data, error } = await this.cliente.database
      .from('profesionales')
      .update(payload)
      .eq('id', id)
      .select('id, nombre, tipo, localidad, provincia, telefono, email, activo, created_at')
      .limit(1)

    const fila = primeraFila<FilaProfesional>(data)
    if (error || !fila) throw new Error('No se pudo actualizar el profesional')
    return aProfesional(fila)
  }
}

export function getProfesionalesRepository() {
  const config = useRuntimeConfig()
  const url = String(config.insforgeUrl || '')
  const apiKey = String(config.insforgeApiKey || '')
  if (!url || !apiKey) throw createError({ statusCode: 500, statusMessage: 'InsForge no configurado' })
  return createProfesionalesRepository(url, apiKey)
}
