import { z } from 'zod'
import { getProfesionalesRepository } from '../../../repositories/profesionales'
import { exigirAdmin } from '../../../utils/admin'

const cuerpoSchema = z.object({
  nombre: z.string().trim().min(2).max(160).optional(),
  tipo: z.enum(['abogado', 'notaria']).optional(),
  localidad: z.string().trim().min(2).max(120).optional(),
  provincia: z.string().trim().min(2).max(120).optional(),
  telefono: z.string().trim().max(32).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  activo: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta el id' })
  const parseado = cuerpoSchema.safeParse(await readBody(event))
  if (!parseado.success) {
    throw createError({ statusCode: 400, statusMessage: 'Revisa los datos del profesional' })
  }
  try {
    return await getProfesionalesRepository().actualizar(id, parseado.data)
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo actualizar el profesional' })
  }
})
