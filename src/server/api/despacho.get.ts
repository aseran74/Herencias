import { getRepositories, TENANT_DEMO_ID } from '../repositories'

export default defineEventHandler(async () => {
  const tenant = await getRepositories().tenants.findById(TENANT_DEMO_ID)
  if (!tenant) {
    throw createError({ statusCode: 404, statusMessage: 'No hay despacho configurado' })
  }
  return { nombre: tenant.nombre }
})
