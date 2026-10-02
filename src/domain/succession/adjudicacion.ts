import { aplicarBps, repartirPorBps, sumarMapas } from './money'
import type {
  DesgloseHeredero,
  Input,
  ResultadoAdjudicacion,
} from './types'

export interface CalculoAdjudicacion {
  detalle: ResultadoAdjudicacion[]
  patrimonioPendienteAdjudicarCent: number
}

export function calcularAdjudicacion(
  input: Input,
  derechos: readonly DesgloseHeredero[],
  nombres: ReadonlyMap<string, string>,
): CalculoAdjudicacion {
  const adjudicado = new Map<string, number>()
  let patrimonioPendienteAdjudicarCent = 0

  for (const inmueble of input.inmuebles) {
    const valorNetoCent = aplicarBps(
      inmueble.valorCent - inmueble.cargasCent,
      inmueble.porcentajeCausanteBps,
    )
    const reparto = input.adjudicaciones
      .filter(item => item.inmuebleId === inmueble.id)
      .map(item => ({
        herederoId: item.herederoId,
        bps: item.bps,
      }))
    const importes = repartirPorBps(valorNetoCent, reparto)
    sumarMapas(adjudicado, importes)
    const asignado = [...importes.values()]
      .reduce((total, importe) => total + importe, 0)
    patrimonioPendienteAdjudicarCent += valorNetoCent - asignado
  }

  const derechoPorId = new Map(
    derechos.map(derecho => [derecho.herederoId, derecho.totalCent]),
  )
  const ids = new Set([...derechoPorId.keys(), ...adjudicado.keys()])
  const detalle = [...ids].map((herederoId) => {
    const derechoCent = derechoPorId.get(herederoId) ?? 0
    const adjudicadoCent = adjudicado.get(herederoId) ?? 0
    return {
      herederoId,
      nombre: nombres.get(herederoId) ?? herederoId,
      derechoCent,
      adjudicadoCent,
      diferenciaCent: adjudicadoCent - derechoCent,
    }
  })

  return { detalle, patrimonioPendienteAdjudicarCent }
}
