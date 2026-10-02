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
})

export type ContactoLead = z.infer<typeof contactoLeadSchema>
