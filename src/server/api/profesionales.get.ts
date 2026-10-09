import type { TipoProfesional } from '../../domain/profesionales'
import { getProfesionalesRepository } from '../repositories/profesionales'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tipo = typeof query.tipo === 'string' && (query.tipo === 'abogado' || query.tipo === 'notaria')
    ? query.tipo as TipoProfesional
    : undefined
  const provincia = typeof query.provincia === 'string' ? query.provincia.trim() : undefined
  try {
    const repo = getProfesionalesRepository()
    return await repo.listar({ tipo, provincia, soloActivos: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar el directorio' })
  }
})
