import { z } from 'zod'
import { getProfesionalesRepository } from '../../repositories/profesionales'
import { exigirAdmin, slugifyId } from '../../utils/admin'

const cuerpoSchema = z.object({
  id: z.string().trim().min(3).max(64).optional(),
  nombre: z.string().trim().min(2).max(160),
  tipo: z.enum(['abogado', 'notaria']),
  localidad: z.string().trim().min(2).max(120),
  provincia: z.string().trim().min(2).max(120),
  telefono: z.string().trim().max(32).optional().default(''),
  email: z.string().trim().email().max(200).optional().or(z.literal('')).default(''),
  activo: z.boolean().optional().default(true),
})

export default defineEventHandler(async (event) => {
  await exigirAdmin(event)
  const parseado = cuerpoSchema.safeParse(await readBody(event))
  if (!parseado.success) {
    throw createError({ statusCode: 400, statusMessage: 'Revisa los datos del profesional' })
  }
  const datos = parseado.data
  const id = datos.id || slugifyId(datos.nombre, datos.tipo)
  try {
    return await getProfesionalesRepository().guardar({
      id,
      nombre: datos.nombre,
      tipo: datos.tipo,
      localidad: datos.localidad,
      provincia: datos.provincia,
      telefono: datos.telefono,
      email: datos.email,
      activo: datos.activo,
    })
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar el profesional' })
  }
})
