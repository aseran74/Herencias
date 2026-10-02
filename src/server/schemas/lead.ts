import { z } from 'zod'
import { inputSucesionSchema } from '../../schemas/succession'

export { inputSucesionSchema } from '../../schemas/succession'

export const contactoLeadSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  telefono: z.string().trim().min(6).max(32),
  consentimiento_rgpd: z.literal(true),
})

export const leadBodySchema = z.object({
  input: inputSucesionSchema,
  contacto: contactoLeadSchema,
  citaExpress: z.boolean().optional().default(false),
  notaExpress: z.string().trim().max(1000).optional().default(''),
  urgente: z.boolean().optional().default(false),
  motivoUrgencia: z.string().trim().max(500).optional().default(''),
  textoUrgencia: z.string().trim().max(8000).optional().default(''),
})

export type ContactoLead = z.infer<typeof contactoLeadSchema>
export type LeadBody = z.infer<typeof leadBodySchema>
