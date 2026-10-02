import { describe, expect, it } from 'vitest'
import { calcularSucesion, estimarIsd, cuotaIntegraEstatalCent, type Input } from '..'

function entrada(comunidad: Input['comunidadIsd'], extra: Partial<Input> = {}): Input {
  return {
    regimen: 'comun',
    regimenEconomico: 'separacion_bienes',
    inmuebles: [],
    otrosActivos: [{ id: 'activo', tipo: 'cuenta', valorCent: 20_000_000, porcentajeCausanteBps: 10_000 }],
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

  it('trata a una entidad de libre disposición como grupo IV', () => {
    const input = entrada('madrid', {
      otrosActivos: [{ id: 'activo', tipo: 'cuenta', valorCent: 60_000_000, porcentajeCausanteBps: 10_000 }],
      beneficiariosLibre: [{ id: 'ong', nombre: 'ONG', tipo: 'entidad' }],
      disposiciones: { mejora: null, libre: [{ herederoId: 'ong', bps: 10_000 }] },
    })
    const estimacion = estimarIsd(input, calcularSucesion(input))
    const ong = estimacion?.porHeredero.find(persona => persona.herederoId === 'ong')
    expect(ong?.grupo).toBe('IV')
    expect(ong?.cuotaCent).toBeGreaterThan(0)
  })
})
