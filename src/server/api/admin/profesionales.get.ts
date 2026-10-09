import type { TipoProfesional } from '../../../domain/profesionales'
import { getProfesionalesRepository } from '../../repositories/profesionales'
import { exigirAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const query = getQuery(event)
  const tipo = typeof query.tipo === 'string' && (query.tipo === 'abogado' || query.tipo === 'notaria')
    ? query.tipo as TipoProfesional
    : undefined
  const provincia = typeof query.provincia === 'string' ? query.provincia.trim() : undefined
  const incluirInactivos = query.todos === '1' || query.todos === 'true'
  return getProfesionalesRepository().listar({
    tipo,
    provincia,
    soloActivos: !incluirInactivos,
  })
})
