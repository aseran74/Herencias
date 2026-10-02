import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  calcularSucesion,
  type Hijo,
  type Input,
} from '..'

const EUR = 100

function hijo(id: string, vive = true, descendientes: Hijo['descendientes'] = []): Hijo {
  return { id, nombre: id.toUpperCase(), vive, descendientes }
}

function inputBase(caudalCent = 2_100_000 * EUR): Input {
  return {
    regimen: 'comun',
    situacionConyugal: 'soltero',
    regimenEconomico: 'separacion_bienes',
    inmuebles: [],
    otrosActivos: [{
      id: 'activo',
      tipo: 'cuenta',
      valorCent: caudalCent,
      porcentajeCausanteBps: 10_000,
    }],
    deudasCent: 0,
    donaciones: [],
    hijos: [hijo('a'), hijo('b'), hijo('c')],
    beneficiariosLibre: [],
    conyugeViudo: false,
    disposiciones: { mejora: null, libre: null },
    adjudicaciones: [],
    comunidadIsd: null,
    quiereAlbacea: null,
    nombreAlbacea: '',
    flags: {
      testamentoAnterior: false,
      hijoConDiscapacidad: false,
      desheredacion: false,
      empresaFamiliar: false,
      bienesExtranjero: false,
      pactoSucesorio: false,
    },
  }
}

function porId(input: Input) {
  const resultado = calcularSucesion(input)
  return {
    resultado,
    herederos: new Map(
      resultado.porHeredero.map(item => [item.herederoId, item]),
    ),
  }
}

describe('núcleo sucesorio', () => {
  it('T1 R2 R3 R8 reparte los tres tercios por estirpes y asigna restos en orden', () => {
    const { resultado, herederos } = porId(inputBase())

    expect(resultado.tercios).toEqual({
      estrictaCent: 700_000 * EUR,
      mejoraCent: 700_000 * EUR,
      libreCent: 700_000 * EUR,
    })
    expect(herederos.get('a')).toMatchObject({
      estrictaCent: 23_333_334,
      mejoraCent: 23_333_334,
      libreCent: 23_333_334,
    })
    expect(herederos.get('b')?.totalCent).toBe(69_999_999)
    expect(herederos.get('c')?.totalCent).toBe(69_999_999)
  })

  it('T2 divide 100 céntimos en tercios 33, 33 y 34', () => {
    expect(calcularSucesion(inputBase(100)).tercios).toEqual({
      estrictaCent: 33,
      mejoraCent: 33,
      libreCent: 34,
    })
  })

  it('T3 R4 R5 permite mejora a descendiente y libre a persona o descendiente', () => {
    const input = inputBase()
    input.hijos[0]!.descendientes = [{ id: 'nieto', nombre: 'Nieto' }]
    input.beneficiariosLibre = [{
      id: 'ong',
      nombre: 'Fundación ONG',
      tipo: 'entidad',
    }]
    input.disposiciones = {
      mejora: [{ herederoId: 'a', bps: 10_000 }],
      libre: [
        { herederoId: 'ong', bps: 5_000 },
        { herederoId: 'nieto', bps: 5_000 },
      ],
    }

    const { resultado, herederos } = porId(input)

    expect(herederos.get('a')?.totalCent).toBe(933_333.34 * EUR)
    expect(herederos.get('ong')).toMatchObject({
      nombre: 'Fundación ONG',
      totalCent: 350_000 * EUR,
    })
    expect(herederos.get('nieto')).toMatchObject({
      nombre: 'Nieto',
      totalCent: 350_000 * EUR,
    })
    expect(herederos.get('b')?.totalCent).toBe(233_333.33 * EUR)
    expect(herederos.get('c')?.totalCent).toBe(233_333.33 * EUR)
    expect(resultado.errores).toEqual([])
  })

  it('T4 R1 resta deudas para obtener el caudal', () => {
    const input = inputBase()
    input.deudasCent = 300_000 * EUR

    const resultado = calcularSucesion(input)

    expect(resultado.caudalCent).toBe(1_800_000 * EUR)
    expect(resultado.tercios).toEqual({
      estrictaCent: 600_000 * EUR,
      mejoraCent: 600_000 * EUR,
      libreCent: 600_000 * EUR,
    })
  })

  it('T5 R6 representa al premuerto y divide su estirpe entre descendientes', () => {
    const input = inputBase()
    input.hijos[2] = hijo('c', false, [
      { id: 'n1', nombre: 'Nieta 1' },
      { id: 'n2', nombre: 'Nieto 2' },
    ])

    const { resultado, herederos } = porId(input)

    expect(resultado.avisos).toContain('REPRESENTACION_PREMORIENCIA')
    expect(herederos.get('n1')?.totalCent).toBe(35_000_001)
    expect(herederos.get('n2')?.totalCent).toBe(34_999_998)
  })

  it('T6 R7 excluye al premuerto sin descendientes de las estirpes', () => {
    const input = inputBase()
    input.hijos[2] = hijo('c', false)

    const { herederos } = porId(input)

    expect(herederos.get('a')?.estrictaCent).toBe(350_000 * EUR)
    expect(herederos.get('b')?.estrictaCent).toBe(350_000 * EUR)
    expect(herederos.has('c')).toBe(false)
  })

  it('T7 devuelve MEJORA_BPS_NO_SUMA_100', () => {
    const input = inputBase()
    input.disposiciones.mejora = [
      { herederoId: 'a', bps: 6_000 },
      { herederoId: 'b', bps: 3_000 },
    ]

    expect(calcularSucesion(input).errores)
      .toContain('MEJORA_BPS_NO_SUMA_100')
  })

  it('T8 rechaza con MEJORA_SOLO_DESCENDIENTES una mejora a ONG', () => {
    const input = inputBase()
    input.beneficiariosLibre = [{
      id: 'ong',
      nombre: 'ONG',
      tipo: 'entidad',
    }]
    input.disposiciones.mejora = [{ herederoId: 'ong', bps: 10_000 }]

    expect(calcularSucesion(input).errores)
      .toContain('MEJORA_SOLO_DESCENDIENTES')
  })

  it('T9 R12 bloquea Cataluña por vecindad civil y deja el caudal', () => {
    const input = inputBase()
    input.regimen = 'cataluna'

    const resultado = calcularSucesion(input)

    expect(resultado).toMatchObject({
      estado: 'revision_obligatoria',
      caudalCent: 2_100_000 * EUR,
      porHeredero: [],
      adjudicacion: [],
    })
    expect(resultado.motivos).toContain('REGIMEN_FORAL')
  })

  it('T10 R10 pondera la participación del causante en gananciales', () => {
    const input = inputBase()
    input.situacionConyugal = 'conyuge_vivo'
    input.regimenEconomico = 'gananciales'
    input.otrosActivos[0]!.porcentajeCausanteBps = 5_000

    const resultado = calcularSucesion(input)

    expect(resultado.caudalCent).toBe(1_050_000 * EUR)
    expect(resultado.tercios?.estrictaCent).toBe(350_000 * EUR)
    expect(resultado.avisos).toContain('REGIMEN_GANANCIALES')
  })

  it('T11 devuelve CAUDAL_NO_POSITIVO cuando las deudas superan activos', () => {
    const input = inputBase()
    input.deudasCent = 2_100_001 * EUR

    const resultado = calcularSucesion(input)

    expect(resultado.estado).toBe('error')
    expect(resultado.errores).toContain('CAUDAL_NO_POSITIVO')
  })

  it('T12 R9 avisa del usufructo del cónyuge sin cambiar importes', () => {
    const input = inputBase()
    const sinConyuge = calcularSucesion(input)
    input.situacionConyugal = 'conyuge_vivo'
    input.conyugeViudo = true

    const conConyuge = calcularSucesion(input)

    expect(conConyuge.avisos)
      .toContain('CONYUGE_VIUDO_USUFRUCTO_MEJORA')
    expect(conConyuge.porHeredero).toEqual(sinConyuge.porHeredero)
  })

  it('T13 R11 calcula adjudicación neta y diferencias informativas', () => {
    const input = inputBase(0)
    input.otrosActivos = []
    input.inmuebles = [
      {
        id: 'i1',
        nombre: 'Casa',
        valorCent: 1_200_000 * EUR,
        porcentajeCausanteBps: 10_000,
        cargasCent: 0,
      },
      {
        id: 'i2',
        nombre: 'Piso',
        valorCent: 900_000 * EUR,
        porcentajeCausanteBps: 10_000,
        cargasCent: 0,
      },
    ]
    input.adjudicaciones = [
      { inmuebleId: 'i1', herederoId: 'a', bps: 10_000 },
      { inmuebleId: 'i2', herederoId: 'b', bps: 5_000 },
      { inmuebleId: 'i2', herederoId: 'c', bps: 5_000 },
    ]

    const resultado = calcularSucesion(input)
    const diferencias = new Map(
      resultado.adjudicacion.map(item => [
        item.herederoId,
        item.diferenciaCent,
      ]),
    )

    // Los dos céntimos de resto de las tres capas corresponden a A (T1).
    expect(diferencias.get('a')).toBe(500_000 * EUR - 2)
    expect(diferencias.get('b')).toBe(-250_000 * EUR + 1)
    expect(diferencias.get('c')).toBe(-250_000 * EUR + 1)
    expect(resultado.avisos).toContain('DIFERENCIAS_ADJUDICACION')
  })

  it('T14 conserva el caudal calculable pero bloquea por donaciones previas', () => {
    const input = inputBase()
    input.donaciones = [{ beneficiarioId: 'a', valorCent: 100 * EUR }]

    const resultado = calcularSucesion(input)

    expect(resultado.estado).toBe('revision_obligatoria')
    expect(resultado.caudalCent).toBe(2_100_100 * EUR)
    expect(resultado.motivos).toContain('DONACIONES_PREVIAS')
    expect(resultado.porHeredero).toEqual([])
  })

  it('T15 devuelve HEREDERO_INEXISTENTE para disposiciones desconocidas', () => {
    const input = inputBase()
    input.disposiciones.libre = [{
      herederoId: 'fantasma',
      bps: 10_000,
    }]

    expect(calcularSucesion(input).errores)
      .toContain('HEREDERO_INEXISTENTE')
  })

  it('T16 conserva el caudal para cualquier entrada válida', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 10_000_000_000 }),
      fc.integer({ min: 1, max: 8 }),
      (caudalCent, numeroHijos) => {
        const input = inputBase(caudalCent)
        input.hijos = Array.from(
          { length: numeroHijos },
          (_, indice) => hijo(`h${indice}`),
        )
        const resultado = calcularSucesion(input)
        const total = resultado.porHeredero.reduce(
          (suma, heredero) => suma + heredero.totalCent,
          0,
        )
        expect(total).toBe(caudalCent)
      },
    ))
  })

  it('valida que cada inmueble no exceda 10000 bps', () => {
    const input = inputBase()
    input.inmuebles = [{
      id: 'i1',
      nombre: 'Casa',
      valorCent: 100_000,
      porcentajeCausanteBps: 10_000,
      cargasCent: 0,
    }]
    input.adjudicaciones = [
      { inmuebleId: 'i1', herederoId: 'a', bps: 6_000 },
      { inmuebleId: 'i1', herederoId: 'b', bps: 5_000 },
    ]

    expect(calcularSucesion(input).errores)
      .toContain('ADJUDICACION_EXCEDE_100')
  })

  it('pondera el valor neto y los bps de cada adjudicación', () => {
    const input = inputBase(0)
    input.otrosActivos = []
    input.inmuebles = [{
      id: 'i1',
      nombre: 'Casa compartida',
      valorCent: 1_000_000,
      porcentajeCausanteBps: 5_000,
      cargasCent: 200_000,
    }]
    input.adjudicaciones = [{
      inmuebleId: 'i1',
      herederoId: 'a',
      bps: 2_500,
    }]

    const resultado = calcularSucesion(input)
    const adjudicacionA = resultado.adjudicacion
      .find(item => item.herederoId === 'a')

    expect(resultado.caudalCent).toBe(400_000)
    expect(adjudicacionA?.adjudicadoCent).toBe(100_000)
    expect(resultado.patrimonioPendienteAdjudicarCent).toBe(300_000)
  })
})
