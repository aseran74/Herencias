import { aplicarBps } from './money'
import type { ComunidadIsd, Input, Resultado } from './types'

/** Tarifa supletoria del art. 21.2 de la Ley 29/1987. Importes en céntimos. */
const TARIFA_ESTATAL = [
  { desdeCent: 0, cuotaCent: 0, tipoBps: 765 },
  { desdeCent: 799_346, cuotaCent: 61_150, tipoBps: 850 },
  { desdeCent: 1_598_091, cuotaCent: 129_043, tipoBps: 935 },
  { desdeCent: 2_396_836, cuotaCent: 203_726, tipoBps: 1020 },
  { desdeCent: 3_195_581, cuotaCent: 285_198, tipoBps: 1105 },
  { desdeCent: 3_994_326, cuotaCent: 373_459, tipoBps: 1190 },
  { desdeCent: 4_793_072, cuotaCent: 468_510, tipoBps: 1275 },
  { desdeCent: 5_591_817, cuotaCent: 570_350, tipoBps: 1360 },
  { desdeCent: 6_390_562, cuotaCent: 678_979, tipoBps: 1445 },
  { desdeCent: 7_189_307, cuotaCent: 794_398, tipoBps: 1530 },
  { desdeCent: 7_988_052, cuotaCent: 916_606, tipoBps: 1615 },
  { desdeCent: 11_975_767, cuotaCent: 1_560_622, tipoBps: 1870 },
  { desdeCent: 15_963_483, cuotaCent: 2_306_325, tipoBps: 2125 },
  { desdeCent: 23_938_913, cuotaCent: 4_001_104, tipoBps: 2550 },
  { desdeCent: 39_877_754, cuotaCent: 8_065_508, tipoBps: 2975 },
  { desdeCent: 79_755_508, cuotaCent: 19_929_140, tipoBps: 3400 },
] as const

const REDUCCION_GRUPO_II_CENT = 1_595_687
const COEFICIENTE_GRUPO_II_BPS = 10_000
const COEFICIENTE_GRUPO_IV_BPS = 20_000

export const COMUNIDADES_ISD: { id: ComunidadIsd, nombre: string }[] = [
  { id: 'andalucia', nombre: 'Andalucía' },
  { id: 'aragon', nombre: 'Aragón' },
  { id: 'asturias', nombre: 'Asturias' },
  { id: 'baleares', nombre: 'Illes Balears' },
  { id: 'canarias', nombre: 'Canarias' },
  { id: 'cantabria', nombre: 'Cantabria' },
  { id: 'castilla_la_mancha', nombre: 'Castilla-La Mancha' },
  { id: 'castilla_y_leon', nombre: 'Castilla y León' },
  { id: 'cataluna', nombre: 'Cataluña' },
  { id: 'ceuta', nombre: 'Ceuta' },
  { id: 'extremadura', nombre: 'Extremadura' },
  { id: 'galicia', nombre: 'Galicia' },
  { id: 'madrid', nombre: 'Comunidad de Madrid' },
  { id: 'melilla', nombre: 'Melilla' },
  { id: 'murcia', nombre: 'Región de Murcia' },
  { id: 'navarra', nombre: 'Navarra' },
  { id: 'pais_vasco', nombre: 'País Vasco' },
  { id: 'la_rioja', nombre: 'La Rioja' },
  { id: 'valencia', nombre: 'Comunitat Valenciana' },
]

export interface CuotaIsd {
  herederoId: string
  nombre: string
  grupo: 'II' | 'IV'
  baseImponibleCent: number
  cuotaCent: number | null
}

export interface EstimacionIsd {
  comunidad: ComunidadIsd
  nombreComunidad: string
  totalCent: number | null
  porHeredero: CuotaIsd[]
  revisar: boolean
  notas: string[]
}

export function cuotaIntegraEstatalCent(baseLiquidableCent: number): number {
  if (baseLiquidableCent <= 0) return 0
  let tramo: (typeof TARIFA_ESTATAL)[number] = TARIFA_ESTATAL[0]
  for (const candidato of TARIFA_ESTATAL) {
    if (candidato.desdeCent <= baseLiquidableCent) tramo = candidato
    else break
  }
  return tramo.cuotaCent + aplicarBps(baseLiquidableCent - tramo.desdeCent, tramo.tipoBps)
}

function cuotaConBonificacion(baseCent: number, grupo: 'II' | 'IV', reduccionCent: number, bonificacionBps: number): number {
  const liquidable = Math.max(0, baseCent - (grupo === 'II' ? reduccionCent : 0))
  const tributaria = aplicarBps(
    cuotaIntegraEstatalCent(liquidable),
    grupo === 'II' ? COEFICIENTE_GRUPO_II_BPS : COEFICIENTE_GRUPO_IV_BPS,
  )
  return aplicarBps(tributaria, 10_000 - bonificacionBps)
}

function liquidar(comunidad: ComunidadIsd, grupo: 'II' | 'IV', baseCent: number): { cuotaCent: number | null, revisar: boolean } {
  if (grupo === 'IV') {
    if (comunidad === 'canarias') return { cuotaCent: cuotaConBonificacion(baseCent, 'IV', 0, 9990), revisar: false }
    if (comunidad === 'ceuta' || comunidad === 'melilla') return { cuotaCent: cuotaConBonificacion(baseCent, 'IV', 0, 5000), revisar: false }
    if (comunidad === 'cataluna' || comunidad === 'navarra' || comunidad === 'pais_vasco') {
      return { cuotaCent: null, revisar: true }
    }
    return { cuotaCent: cuotaConBonificacion(baseCent, 'IV', 0, 0), revisar: false }
  }

  switch (comunidad) {
    case 'cantabria':
    case 'baleares':
      return { cuotaCent: 0, revisar: false }
    case 'madrid':
    case 'murcia':
    case 'la_rioja':
    case 'valencia':
      return { cuotaCent: cuotaConBonificacion(baseCent, 'II', REDUCCION_GRUPO_II_CENT, 9900), revisar: false }
    case 'castilla_y_leon':
      return { cuotaCent: cuotaConBonificacion(baseCent, 'II', 6_000_000, 9900), revisar: false }
    case 'andalucia':
    case 'galicia':
      return { cuotaCent: cuotaConBonificacion(baseCent, 'II', 100_000_000, 9900), revisar: false }
    case 'canarias':
      return { cuotaCent: cuotaConBonificacion(baseCent, 'II', REDUCCION_GRUPO_II_CENT, 9990), revisar: false }
    case 'ceuta':
    case 'melilla':
      return { cuotaCent: cuotaConBonificacion(baseCent, 'II', REDUCCION_GRUPO_II_CENT, 5000), revisar: false }
    case 'extremadura':
      if (baseCent <= 50_000_000) return { cuotaCent: 0, revisar: false }
      if (baseCent <= 60_000_000) return { cuotaCent: cuotaConBonificacion(baseCent, 'II', REDUCCION_GRUPO_II_CENT, 9000), revisar: false }
      return { cuotaCent: cuotaConBonificacion(baseCent, 'II', REDUCCION_GRUPO_II_CENT, 0), revisar: true }
    case 'castilla_la_mancha': {
      if (baseCent <= 30_000_000) return { cuotaCent: 0, revisar: false }
      const total = cuotaConBonificacion(baseCent, 'II', REDUCCION_GRUPO_II_CENT, 0)
      const hastaUmbral = cuotaConBonificacion(30_000_000, 'II', REDUCCION_GRUPO_II_CENT, 0)
      return { cuotaCent: aplicarBps(Math.max(0, total - hastaUmbral), 2000), revisar: false }
    }
    case 'asturias':
      if (baseCent <= 30_000_000) return { cuotaCent: 0, revisar: false }
      return { cuotaCent: null, revisar: true }
    case 'aragon':
      return { cuotaCent: cuotaConBonificacion(baseCent, 'II', 50_000_000, 0), revisar: true }
    case 'pais_vasco':
      return { cuotaCent: aplicarBps(Math.max(0, baseCent - 40_000_000), 150), revisar: true }
    case 'cataluna':
    case 'navarra':
      return { cuotaCent: null, revisar: true }
  }
}

function idsDescendientes(input: Input): Set<string> {
  const ids = new Set<string>()
  for (const hijo of input.hijos) {
    if (hijo.vive) ids.add(hijo.id)
    else hijo.descendientes.forEach(nieto => ids.add(nieto.id))
  }
  return ids
}

export function estimarIsd(input: Input, resultado: Resultado): EstimacionIsd | null {
  if (!input.comunidadIsd) return null
  const comunidad = input.comunidadIsd
  const nombreComunidad = COMUNIDADES_ISD.find(item => item.id === comunidad)?.nombre ?? comunidad
  const descendientes = idsDescendientes(input)
  const notas = new Set<string>()
  let revisar = false

  if (resultado.porHeredero.length === 0) {
    return {
      comunidad,
      nombreComunidad,
      totalCent: null,
      porHeredero: [],
      revisar: true,
      notas: ['Sin reparto no hay base individual para estimar el impuesto.'],
    }
  }

  const porHeredero = resultado.porHeredero.map((persona) => {
    const grupo = descendientes.has(persona.herederoId) ? 'II' as const : 'IV' as const
    const liquidacion = liquidar(comunidad, grupo, persona.totalCent)
    if (liquidacion.revisar) revisar = true
    return {
      herederoId: persona.herederoId,
      nombre: persona.nombre,
      grupo,
      baseImponibleCent: persona.totalCent,
      cuotaCent: liquidacion.cuotaCent,
    }
  })

  if (porHeredero.some(persona => persona.grupo === 'IV')) {
    notas.add('Quien no es descendiente se estima como grupo IV, con coeficiente 2,0000 y sin bonificación familiar, salvo Canarias, Ceuta y Melilla.')
  }
  if (comunidad === 'cataluna') notas.add('Cataluña tiene tarifa y bonificación propias. El despacho calculará la cuota.')
  if (comunidad === 'navarra') notas.add('Navarra tiene tarifa foral. El despacho calculará la cuota.')
  if (comunidad === 'pais_vasco') notas.add('Estimación foral: exención de 400.000 € y 1,5 % sobre el exceso. Álava, Bizkaia y Gipuzkoa pueden diferir.')
  if (comunidad === 'aragon') notas.add('En Aragón se aplica una reducción orientativa de hasta 500.000 €. Exige requisitos que el despacho debe comprobar.')
  if (comunidad === 'asturias' && porHeredero.some(persona => persona.cuotaCent === null)) {
    notas.add('Por encima de 300.000 € Asturias aplica una tarifa propia. El despacho calculará esa cuota.')
  }
  if (comunidad === 'extremadura' && revisar) {
    notas.add('Por encima de 600.000 € la cifra usa la tarifa estatal, sin la bonificación de los tramos inferiores.')
  }

  const totalCent = porHeredero.every(persona => persona.cuotaCent !== null)
    ? porHeredero.reduce((suma, persona) => suma + (persona.cuotaCent ?? 0), 0)
    : null

  return { comunidad, nombreComunidad, totalCent, porHeredero, revisar, notas: [...notas] }
}
