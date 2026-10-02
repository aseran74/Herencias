import { BPS_TOTAL } from './money'
import type { CodigoError, Input } from './types'

export function hayEstirpes(input: Input): boolean {
  return input.hijos.some(hijo => hijo.vive || hijo.descendientes.length > 0)
}

export function idsDescendientesVivos(input: Input): Set<string> {
  const ids = new Set<string>()

  for (const hijo of input.hijos) {
    if (hijo.vive) ids.add(hijo.id)
    for (const descendiente of hijo.descendientes) ids.add(descendiente.id)
  }

  return ids
}

export function validarInput(input: Input): CodigoError[] {
  const errores = new Set<CodigoError>()
  const descendientes = idsDescendientesVivos(input)
  const beneficiariosLibres = new Set(
    input.beneficiariosLibre.map(beneficiario => beneficiario.id),
  )
  const destinatariosLibres = new Set([
    ...descendientes,
    ...beneficiariosLibres,
  ])

  if (!hayEstirpes(input) && !input.beneficiariosLibre.some(persona => persona.nombre.trim())) {
    errores.add(input.tieneHijos === false ? 'SIN_HEREDEROS' : 'SIN_HIJOS')
  }

  if (input.disposiciones.mejora !== null) {
    const suma = input.disposiciones.mejora.reduce(
      (total, reparto) => total + reparto.bps,
      0,
    )
    if (suma !== BPS_TOTAL) errores.add('MEJORA_BPS_NO_SUMA_100')

    for (const reparto of input.disposiciones.mejora) {
      if (!descendientes.has(reparto.herederoId)) {
        if (beneficiariosLibres.has(reparto.herederoId)) {
          errores.add('MEJORA_SOLO_DESCENDIENTES')
        } else {
          errores.add('HEREDERO_INEXISTENTE')
        }
      }
    }
  }

  if (input.disposiciones.libre !== null) {
    const suma = input.disposiciones.libre.reduce(
      (total, reparto) => total + reparto.bps,
      0,
    )
    if (suma !== BPS_TOTAL) errores.add('LIBRE_BPS_NO_SUMA_100')

    for (const reparto of input.disposiciones.libre) {
      if (!destinatariosLibres.has(reparto.herederoId)) {
        errores.add('HEREDERO_INEXISTENTE')
      }
    }
  }

  const inmuebles = new Set(input.inmuebles.map(inmueble => inmueble.id))
  const bpsPorInmueble = new Map<string, number>()
  for (const adjudicacion of input.adjudicaciones) {
    if (
      !inmuebles.has(adjudicacion.inmuebleId)
      || !destinatariosLibres.has(adjudicacion.herederoId)
    ) {
      errores.add('HEREDERO_INEXISTENTE')
    }
    bpsPorInmueble.set(
      adjudicacion.inmuebleId,
      (bpsPorInmueble.get(adjudicacion.inmuebleId) ?? 0) + adjudicacion.bps,
    )
  }
  if ([...bpsPorInmueble.values()].some(bps => bps > BPS_TOTAL)) {
    errores.add('ADJUDICACION_EXCEDE_100')
  }

  return [...errores]
}
