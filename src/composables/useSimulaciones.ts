import type { Input } from '../domain/succession'
import { inputSucesionSchema } from '../schemas/succession'
import { useInsforgeClient } from './useInsforgeClient'

export interface SimulacionGuardada {
  id: string
  titulo: string
  input: Input
  paso: number
  createdAt: string
  updatedAt: string
}

interface FilaSimulacion {
  id: string
  titulo: string
  input_json: unknown
  paso: number
  created_at: string
  updated_at: string
}

const COLUMNAS = 'id, titulo, input_json, paso, created_at, updated_at'

function convertir(fila: FilaSimulacion): SimulacionGuardada | null {
  const input = inputSucesionSchema.safeParse(fila.input_json)
  if (!input.success) return null
  return {
    id: fila.id,
    titulo: fila.titulo,
    input: input.data,
    paso: fila.paso,
    createdAt: fila.created_at,
    updatedAt: fila.updated_at,
  }
}

export function useSimulaciones() {
  const cliente = useInsforgeClient()

  async function listar(): Promise<SimulacionGuardada[]> {
    const { data, error } = await cliente.database
      .from('simulaciones_guardadas')
      .select(COLUMNAS)
      .order('updated_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message || 'No se pudieron cargar las simulaciones')
    return (Array.isArray(data) ? data : [])
      .map(fila => convertir(fila as FilaSimulacion))
      .filter((fila): fila is SimulacionGuardada => Boolean(fila))
  }

  async function guardar(userId: string, titulo: string, input: Input, paso: number): Promise<SimulacionGuardada> {
    const { data, error } = await cliente.database
      .from('simulaciones_guardadas')
      .insert([{
        user_id: userId,
        titulo: titulo.trim(),
        input_json: input,
        paso,
        version: 1,
      }])
      .select(COLUMNAS)
      .limit(1)
    const fila = Array.isArray(data) ? data[0] : data
    const simulacion = fila ? convertir(fila as FilaSimulacion) : null
    if (error || !simulacion) throw new Error(error?.message || 'No se pudo guardar la simulación')
    return simulacion
  }

  async function renombrar(id: string, titulo: string): Promise<void> {
    const { error } = await cliente.database
      .from('simulaciones_guardadas')
      .update({ titulo: titulo.trim() })
      .eq('id', id)
    if (error) throw new Error(error.message || 'No se pudo renombrar la simulación')
  }

  async function eliminar(id: string): Promise<void> {
    const { error } = await cliente.database
      .from('simulaciones_guardadas')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message || 'No se pudo eliminar la simulación')
  }

  return { listar, guardar, renombrar, eliminar }
}
