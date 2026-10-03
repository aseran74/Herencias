import { z } from 'zod'

const id = z.string().trim().min(1).max(100)
const centimos = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const bps = z.number().int().min(0).max(10_000)

const repartoSchema = z.object({
  herederoId: id,
  bps,
})

export const inputSucesionSchema = z.object({
  regimen: z.enum(['comun', 'cataluna', 'navarra', 'pais_vasco', 'galicia', 'aragon', 'baleares']),
  situacionConyugal: z.enum(['conyuge_vivo', 'viudo', 'soltero', 'separado_divorciado']).nullable().default(null),
  regimenEconomico: z.enum(['gananciales', 'separacion_bienes', 'soltero_viudo']),
  inmuebles: z.array(z.object({
    id,
    nombre: z.string().trim().min(1).max(160),
    naturaleza: z.enum(['ganancial', 'privativo', 'otra']).default('privativo'),
    valorCent: centimos,
    porcentajeCausanteBps: bps,
    cargasCent: centimos,
  })).max(30),
  otrosActivos: z.array(z.object({
    id,
    tipo: z.enum(['fondo', 'deposito', 'cuenta', 'otro']),
    naturaleza: z.enum(['ganancial', 'privativo', 'otra']).default('privativo'),
    valorCent: centimos,
    porcentajeCausanteBps: bps,
  })).max(30),
  deudasCent: centimos,
  donaciones: z.array(z.object({
    beneficiarioId: id,
    valorCent: centimos,
  })).max(30),
  hijos: z.array(z.object({
    id,
    nombre: z.string().trim().min(1).max(120),
    vive: z.boolean(),
    descendientes: z.array(z.object({
      id,
      nombre: z.string().trim().min(1).max(120),
    })).max(20),
  })).max(20),
  tieneHijos: z.boolean().nullable().default(null),
  destinosColaterales: z.object({
    hermanos: z.boolean().default(false),
    sobrinos: z.boolean(),
    nietos: z.boolean(),
    familiarCercano: z.boolean(),
    ong: z.boolean().default(false),
  }).default({ hermanos: false, sobrinos: false, nietos: false, familiarCercano: false, ong: false }),
  beneficiariosLibre: z.array(z.object({
    id,
    nombre: z.string().trim().min(1).max(160),
    tipo: z.enum(['persona', 'entidad']),
    parentesco: z.enum(['descendiente', 'cercano', 'ajeno']).optional(),
    rol: z.enum(['hermano', 'sobrino', 'nieto', 'familiar_cercano', 'ong']).optional(),
  })).max(30),
  conyugeViudo: z.boolean(),
  disposiciones: z.object({
    mejora: z.array(repartoSchema).max(50).nullable(),
    libre: z.array(repartoSchema).max(50).nullable(),
  }),
  adjudicaciones: z.array(z.object({
    inmuebleId: id,
    herederoId: id,
    bps,
  })).max(100),
  comunidadIsd: z.enum([
    'andalucia', 'aragon', 'asturias', 'baleares', 'canarias', 'cantabria',
    'castilla_la_mancha', 'castilla_y_leon', 'cataluna', 'ceuta', 'extremadura',
    'galicia', 'madrid', 'melilla', 'murcia', 'navarra', 'pais_vasco', 'la_rioja', 'valencia',
  ]).nullable(),
  quiereAlbacea: z.boolean().nullable(),
  nombreAlbacea: z.string().trim().max(160),
  facultadesAlbacea: z.object({
    informacionBancaria: z.boolean(),
    gestionarPagos: z.boolean(),
    pagarDeudasImpuestos: z.boolean(),
    conservarBienes: z.boolean(),
  }).default({
    informacionBancaria: true,
    gestionarPagos: true,
    pagarDeudasImpuestos: true,
    conservarBienes: true,
  }),
  atribucionEstricta: z.object({
    tipo: z.enum(['inmueble', 'alquiler']).nullable(),
    inmuebleId: z.string().trim().min(1).max(100).nullable(),
  }).default({ tipo: null, inmuebleId: null }),
  flags: z.object({
    testamentoAnterior: z.boolean(),
    hijoConDiscapacidad: z.boolean(),
    desheredacion: z.boolean(),
    empresaFamiliar: z.boolean(),
    bienesExtranjero: z.boolean(),
    pactoSucesorio: z.boolean(),
  }),
})
