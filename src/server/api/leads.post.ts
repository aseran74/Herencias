import { calcularSucesion } from '../../domain/succession'
import { createAdminClient } from '@insforge/sdk'
import { getRepositories, TENANT_DEMO_ID } from '../repositories'
import { leadBodySchema } from '../schemas/lead'
import type { ZodError } from 'zod'

const CUBO_GRABACIONES = 'grabaciones-express'
const TAMANO_MAXIMO = 20 * 1024 * 1024

function mensajeValidacionLead(error: ZodError) {
  const rutas = new Set(error.issues.map(issue => issue.path.join('.')))
  if ([...rutas].some(ruta => ruta.startsWith('contacto.'))) {
    return 'Completa nombre, email, teléfono y el consentimiento RGPD.'
  }
  return 'Revisa los datos de la consulta'
}
export default defineEventHandler(async (event) => {
  const { json, grabacion } = await leerSolicitud(event)
  const body = leadBodySchema.safeParse(json)
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: mensajeValidacionLead(body.error) })
  }

  const { leads, tenants } = getRepositories()
  const tenant = await tenants.findById(TENANT_DEMO_ID)
  if (!tenant) {
    throw createError({ statusCode: 500, statusMessage: 'No hay despacho configurado' })
  }

  let grabacionUrl: string | null = null
  let grabacionKey: string | null = null
  let shareToken: string | null = null
  if (grabacion && grabacion.data.byteLength > 0 && (body.data.citaExpress || body.data.urgente)) {
    const subida = await subirGrabacion(grabacion)
    grabacionUrl = subida.url
    grabacionKey = subida.key
    shareToken = crypto.randomUUID().replace(/-/g, '')
  }

  try {
    const lead = await leads.save({
      tenantId: tenant.id,
      contacto: body.data.contacto,
      input: body.data.input,
      resultado: calcularSucesion(body.data.input),
      citaExpress: body.data.citaExpress || body.data.urgente,
      notaExpress: body.data.notaExpress,
      urgente: body.data.urgente,
      motivoUrgencia: body.data.motivoUrgencia,
      textoUrgencia: body.data.textoUrgencia,
      grabacionUrl,
      grabacionKey,
      profesionalId: body.data.profesionalId,
      shareToken,
    })
    const shareUrl = shareToken ? `/compartir/${shareToken}` : null
    return { id: lead.id, shareUrl, shareToken }
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar la consulta' })
  }
})

async function leerSolicitud(event: Parameters<typeof readBody>[0]) {
  const tipo = getHeader(event, 'content-type') ?? ''
  if (!tipo.includes('multipart/form-data')) {
    return { json: await readBody(event), grabacion: undefined }
  }
  const partes = await readMultipartFormData(event) ?? []
  const payload = partes.find(parte => parte.name === 'payload')
  const grabacion = partes.find(parte => parte.name === 'grabacion')
  if (!payload) throw createError({ statusCode: 400, statusMessage: 'Revisa los datos de la consulta' })
  try {
    return { json: JSON.parse(payload.data.toString('utf8')), grabacion }
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Revisa los datos de la consulta' })
  }
}

async function subirGrabacion(archivo: { filename?: string; type?: string; data: Buffer }) {
  if (archivo.data.byteLength > TAMANO_MAXIMO) {
    throw createError({ statusCode: 400, statusMessage: 'La grabación es demasiado grande' })
  }
  const config = useRuntimeConfig()
  const url = String(config.insforgeUrl || '')
  const apiKey = String(config.insforgeApiKey || '')
  if (!url || !apiKey) throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar la grabación' })

  const clave = `express/${crypto.randomUUID()}.webm`
  const cliente = createAdminClient({ baseUrl: url, apiKey })
  const { data, error } = await cliente.storage.from(CUBO_GRABACIONES).upload(
    clave,
    new Blob([Uint8Array.from(archivo.data)], { type: archivo.type || 'video/webm' }),
  )
  if (error || !data) throw createError({ statusCode: 500, statusMessage: 'No se pudo guardar la grabación' })
  return { url: data.url as string, key: data.key as string }
}
