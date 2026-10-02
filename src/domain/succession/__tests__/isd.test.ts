import { describe, expect, it } from 'vitest'
import { calcularSucesion, estimarIsd, cuotaIntegraEstatalCent, type Input } from '..'

function entrada(comunidad: Input['comunidadIsd'], extra: Partial<Input> = {}): Input {
  return {
    regimen: 'comun',
    situacionConyugal: 'soltero',
    regimenEconomico: 'separacion_bienes',
    inmuebles: [],
    otrosActivos: [{ id: 'activo', tipo: 'cuenta', naturaleza: 'privativo', valorCent: 20_000_000, porcentajeCausanteBps: 10_000 }],
    deudasCent: 0,
    donaciones: [],
    hijos: [{ id: 'ana', nombre: 'Ana', vive: true, descendientes: [] }],
    beneficiariosLibre: [],
    conyugeViudo: false,
    disposiciones: { mejora: null, libre: null },
    adjudicaciones: [],
    comunidadIsd: comunidad,
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
    ...extra,
  }
}

describe('estimación ISD', () => {
  it('aplica el primer tramo estatal al 7,65 %', () => {
    expect(cuotaIntegraEstatalCent(799_346)).toBe(61_150)
  })

  it('en Madrid un descendiente que recibe 200.000 € paga el 1 % de la cuota', () => {
    const input = entrada('madrid')
    const estimacion = estimarIsd(input, calcularSucesion(input))
    expect(estimacion?.porHeredero[0]).toMatchObject({ grupo: 'II', cuotaCent: 28_250 })
    expect(estimacion?.totalCent).toBe(28_250)
  })

  it('en Andalucía una adquisición de 200.000 € queda en cero por la reducción de un millón', () => {
    const input = entrada('andalucia')
    expect(estimarIsd(input, calcularSucesion(input))?.totalCent).toBe(0)
  })

  it('en Cataluña no inventa una cuota', () => {
    const input = entrada('cataluna')
    const estimacion = estimarIsd(input, calcularSucesion(input))
    expect(estimacion?.totalCent).toBeNull()
    expect(estimacion?.revisar).toBe(true)
  })

  it('trata a un nieto de libre disposición como grupo II si se marca descendiente', () => {
    const input = entrada('madrid', {
      otrosActivos: [{ id: 'activo', tipo: 'cuenta', naturaleza: 'privativo', valorCent: 60_000_000, porcentajeCausanteBps: 10_000 }],
      beneficiariosLibre: [{ id: 'lucas', nombre: 'Lucas Serrano', tipo: 'persona', parentesco: 'descendiente' }],
      disposiciones: { mejora: null, libre: [{ herederoId: 'lucas', bps: 10_000 }] },
    })
    const lucas = estimarIsd(input, calcularSucesion(input))?.porHeredero.find(persona => persona.herederoId === 'lucas')
    expect(lucas).toMatchObject({ grupo: 'II', cuotaCent: 28_250 })
  })

  it('trata a un sobrino como grupo III, por debajo del extraño', () => {
    const base = {
      otrosActivos: [{ id: 'activo', tipo: 'cuenta' as const, naturaleza: 'privativo' as const, valorCent: 60_000_000, porcentajeCausanteBps: 10_000 }],
      disposiciones: { mejora: null, libre: [{ herederoId: 'lucas', bps: 10_000 }] },
    }
    const sobrino = entrada('madrid', {
      ...base,
      beneficiariosLibre: [{ id: 'lucas', nombre: 'Lucas Serrano', tipo: 'persona', parentesco: 'cercano' }],
    })
    const extrano = entrada('madrid', {
      ...base,
      beneficiariosLibre: [{ id: 'lucas', nombre: 'Lucas Serrano', tipo: 'persona', parentesco: 'ajeno' }],
    })
    const cuotaSobrino = estimarIsd(sobrino, calcularSucesion(sobrino))?.porHeredero.find(persona => persona.herederoId === 'lucas')
    const cuotaExtrano = estimarIsd(extrano, calcularSucesion(extrano))?.porHeredero.find(persona => persona.herederoId === 'lucas')
    expect(cuotaSobrino?.grupo).toBe('III')
    expect(cuotaSobrino?.cuotaCent).toBeGreaterThan(28_250)
    expect(cuotaSobrino!.cuotaCent!).toBeLessThan(cuotaExtrano!.cuotaCent!)
  })

  it('trata a una entidad de libre disposición como grupo IV', () => {
    const input = entrada('madrid', {
      otrosActivos: [{ id: 'activo', tipo: 'cuenta', naturaleza: 'privativo', valorCent: 60_000_000, porcentajeCausanteBps: 10_000 }],
      beneficiariosLibre: [{ id: 'ong', nombre: 'ONG', tipo: 'entidad' }],
      disposiciones: { mejora: null, libre: [{ herederoId: 'ong', bps: 10_000 }] },
    })
    const estimacion = estimarIsd(input, calcularSucesion(input))
    const ong = estimacion?.porHeredero.find(persona => persona.herederoId === 'ong')
    expect(ong?.grupo).toBe('IV')
    expect(ong?.cuotaCent).toBeGreaterThan(0)
  })
})
