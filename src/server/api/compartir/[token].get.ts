import { createAdminClient } from '@insforge/sdk'
import { getRepositories } from '../../repositories'

const CUBO_GRABACIONES = 'grabaciones-express'
const EXPIRACION_SEGUNDOS = 60 * 60 * 24 * 7

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')?.trim()
  if (!token || token.length < 16) {
    throw createError({ statusCode: 404, statusMessage: 'Enlace no válido' })
  }

  const { leads } = getRepositories()
  const lead = await leads.findByShareToken(token)
  if (!lead || !lead.grabacionKey) {
    throw createError({ statusCode: 404, statusMessage: 'No hay vídeo para este enlace' })
  }

  const config = useRuntimeConfig()
  const url = String(config.insforgeUrl || '')
  const apiKey = String(config.insforgeApiKey || '')
  if (!url || !apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo abrir el vídeo' })
  }

  const cliente = createAdminClient({ baseUrl: url, apiKey })
  const { data, error } = await cliente.storage
    .from(CUBO_GRABACIONES)
    .createSignedUrl(lead.grabacionKey, EXPIRACION_SEGUNDOS)

  if (error || !data?.signedUrl) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo abrir el vídeo' })
  }

  return {
    videoUrl: data.signedUrl,
    urgente: lead.urgente,
    nombre: lead.contacto.nombre,
    createdAt: lead.createdAt,
  }
})
