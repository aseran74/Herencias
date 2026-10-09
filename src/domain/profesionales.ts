export type TipoProfesional = 'abogado' | 'notaria'

export interface Profesional {
  id: string
  nombre: string
  tipo: TipoProfesional
  localidad: string
  provincia: string
  telefono: string
  email: string
  activo: boolean
  createdAt?: string
}

export function guiaAbogadoONotaria(estado: string, avisos: number, errores: number): {
  recomendacion: 'abogado' | 'notaria' | 'ambos'
  texto: string
} {
  if (errores > 0 || estado === 'error' || estado === 'revision_obligatoria') {
    return {
      recomendacion: 'abogado',
      texto: 'Hay puntos que conviene revisar con un abogado antes de ir al notario. La asesoría evita errores en el otorgamiento.',
    }
  }
  if (avisos > 0 || estado === 'ok_con_avisos') {
    return {
      recomendacion: 'ambos',
      texto: 'El reparto está bastante claro, pero hay avisos. Si tienes dudas, ve primero a un abogado; si lo tienes claro, puedes ir directamente a una notaría.',
    }
  }
  return {
    recomendacion: 'notaria',
    texto: 'El reparto está claro. Puedes ir directamente a una notaría con este borrador. Si prefieres una segunda opinión, elige un despacho de abogados.',
  }
}
