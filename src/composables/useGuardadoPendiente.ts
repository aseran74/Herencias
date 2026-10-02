import type { Input } from '../domain/succession'
import { inputSucesionSchema } from '../schemas/succession'

const CLAVE = 'herencias:guardado-pendiente'

export interface GuardadoPendiente {
  titulo: string
  input: Input
  paso: number
}

export function guardarPendiente(pendiente: GuardadoPendiente) {
  sessionStorage.setItem(CLAVE, JSON.stringify(pendiente))
}

export function leerPendiente(): GuardadoPendiente | null {
  const valor = sessionStorage.getItem(CLAVE)
  if (!valor) return null
  try {
    const dato = JSON.parse(valor) as Record<string, unknown>
    const input = inputSucesionSchema.safeParse(dato.input)
    if (!input.success || typeof dato.titulo !== 'string' || typeof dato.paso !== 'number') return null
    return { titulo: dato.titulo, input: input.data, paso: dato.paso }
  } catch {
    return null
  }
}

export function borrarPendiente() {
  sessionStorage.removeItem(CLAVE)
}
