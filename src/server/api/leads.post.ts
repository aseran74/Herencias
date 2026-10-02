import { calcularSucesion } from '../../domain/succession'
import { getRepositories, TENANT_DEMO_ID } from '../repositories'
import { leadBodySchema } from '../schemas/lead'

export default defineEventHandler(async (event) => {
  const body = leadBodySchema.safeParse(await readBody(event))
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'Revisa los datos de la consulta' })
  }

  const { leads, tenants } = getRepositories()
  const tenant = await tenants.findById(TENANT_DEMO_ID)
  if (!tenant) {
    throw createError({ statusCode: 500, statusMessage: 'No hay despacho configurado' })
  }

  let lead
  try {
    lead = await leads.save({
      tenantId: tenant.id,
      contacto: body.data.contacto,
      input: body.data.input,
      resultado: calcularSucesion(body.data.input),
    })
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar la consulta' })
  }

  return { id: lead.id }
})
