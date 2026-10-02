import { calcularAdjudicacion } from './adjudicacion'
import { detectarAvisos, detectarCasosBloqueantes } from './hotCases'
import {
  aplicarBps,
  repartirIgual,
  repartirPorBps,
  sumarMapas,
} from './money'
import type {
  CodigoAviso,
  DesgloseHeredero,
  Hijo,
  Input,
  Resultado,
  Tercios,
} from './types'
import { validarInput } from './validate'

function datosMonetariosValidos(input: Input): boolean {
  const valores = [
    input.deudasCent,
    ...input.inmuebles.flatMap(inmueble => [
      inmueble.valorCent,
      inmueble.cargasCent,
      inmueble.porcentajeCausanteBps,
    ]),
    ...input.otrosActivos.flatMap(activo => [
      activo.valorCent,
      activo.porcentajeCausanteBps,
    ]),
    ...input.donaciones.map(donacion => donacion.valorCent),
  ]
  return valores.every(Number.isSafeInteger)
}

export function calcularCaudal(input: Input): number | null {
  if (!datosMonetariosValidos(input)) return null

  const inmuebles = input.inmuebles.reduce(
    (total, inmueble) => total + aplicarBps(
      inmueble.valorCent - inmueble.cargasCent,
      inmueble.porcentajeCausanteBps,
    ),
    0,
  )
  const otrosActivos = input.otrosActivos.reduce(
    (total, activo) =>
      total + aplicarBps(activo.valorCent, activo.porcentajeCausanteBps),
    0,
  )
  const donaciones = input.donaciones.reduce(
    (total, donacion) => total + donacion.valorCent,
    0,
  )

  const caudal = inmuebles + otrosActivos - input.deudasCent + donaciones
  return Number.isSafeInteger(caudal) ? caudal : null
}

export function calcularTercios(caudalCent: number): Tercios {
  const tercio = Math.floor(caudalCent / 3)
  return {
    estrictaCent: tercio,
    mejoraCent: tercio,
    libreCent: caudalCent - tercio * 2,
  }
}

function estirpes(input: Input): Hijo[] {
  return input.hijos.filter(
    hijo => hijo.vive || hijo.descendientes.length > 0,
  )
}

function repartirPorEstirpes(
  importeCent: number,
  ramas: readonly Hijo[],
): Map<string, number> {
  const resultado = new Map<string, number>()
  const porRama = repartirIgual(
    importeCent,
    ramas.map(rama => rama.id),
  )

  for (const rama of ramas) {
    const importeRama = porRama.get(rama.id) ?? 0
    if (rama.vive) {
      resultado.set(rama.id, importeRama)
    } else {
      sumarMapas(
        resultado,
        repartirIgual(
          importeRama,
          rama.descendientes.map(descendiente => descendiente.id),
        ),
      )
    }
  }

  return resultado
}

function mapaNombres(input: Input): Map<string, string> {
  const nombres = new Map<string, string>()
  for (const hijo of input.hijos) {
    nombres.set(hijo.id, hijo.nombre)
    for (const descendiente of hijo.descendientes) {
      nombres.set(descendiente.id, descendiente.nombre)
    }
  }
  for (const beneficiario of input.beneficiariosLibre) {
    nombres.set(beneficiario.id, beneficiario.nombre)
  }
  return nombres
}

function crearDesglose(
  estricta: ReadonlyMap<string, number>,
  mejora: ReadonlyMap<string, number>,
  libre: ReadonlyMap<string, number>,
  nombres: ReadonlyMap<string, string>,
): DesgloseHeredero[] {
  const ids = new Set([
    ...estricta.keys(),
    ...mejora.keys(),
    ...libre.keys(),
  ])
  return [...ids].map((herederoId) => {
    const estrictaCent = estricta.get(herederoId) ?? 0
    const mejoraCent = mejora.get(herederoId) ?? 0
    const libreCent = libre.get(herederoId) ?? 0
    return {
      herederoId,
      nombre: nombres.get(herederoId) ?? herederoId,
      estrictaCent,
      mejoraCent,
      libreCent,
      totalCent: estrictaCent + mejoraCent + libreCent,
    }
  })
}

function resultadoSinReparto(
  estado: 'revision_obligatoria' | 'error',
  caudalCent: number | null,
  motivos: Resultado['motivos'] = [],
  errores: Resultado['errores'] = [],
  tercios: Tercios | null = null,
): Resultado {
  return {
    estado,
    errores,
    avisos: [],
    motivos,
    caudalCent,
    tercios,
    porHeredero: [],
    adjudicacion: [],
    patrimonioPendienteAdjudicarCent: 0,
  }
}

export function calcularSucesion(input: Input): Resultado {
  const caudalCent = calcularCaudal(input)
  const motivos = detectarCasosBloqueantes(input)
  if (motivos.length > 0) {
    return resultadoSinReparto('revision_obligatoria', caudalCent, motivos)
  }

  if (caudalCent === null || caudalCent <= 0) {
    return resultadoSinReparto(
      'error',
      caudalCent,
      [],
      ['CAUDAL_NO_POSITIVO'],
    )
  }

  const tercios = calcularTercios(caudalCent)
  const errores = validarInput(input)
  if (errores.length > 0) {
    return resultadoSinReparto('error', caudalCent, [], errores, tercios)
  }

  const ramas = estirpes(input)
  const estricta = repartirPorEstirpes(tercios.estrictaCent, ramas)
  const mejora = input.disposiciones.mejora === null
    ? repartirPorEstirpes(tercios.mejoraCent, ramas)
    : repartirPorBps(tercios.mejoraCent, input.disposiciones.mejora)
  const libre = input.disposiciones.libre === null
    ? repartirPorEstirpes(tercios.libreCent, ramas)
    : repartirPorBps(tercios.libreCent, input.disposiciones.libre)
  const nombres = mapaNombres(input)
  const porHeredero = crearDesglose(estricta, mejora, libre, nombres)
  const calculoAdjudicacion = calcularAdjudicacion(
    input,
    porHeredero,
    nombres,
  )
  const avisos: CodigoAviso[] = detectarAvisos(input)

  if (
    input.adjudicaciones.length > 0
    && calculoAdjudicacion.detalle.some(item => item.diferenciaCent !== 0)
  ) {
    avisos.push('DIFERENCIAS_ADJUDICACION')
  }

  return {
    estado: avisos.length > 0 ? 'ok_con_avisos' : 'ok',
    errores: [],
    avisos,
    motivos: [],
    caudalCent,
    tercios,
    porHeredero,
    adjudicacion: calculoAdjudicacion.detalle,
    patrimonioPendienteAdjudicarCent:
      calculoAdjudicacion.patrimonioPendienteAdjudicarCent,
  }
}

export const calcular = calcularSucesion
