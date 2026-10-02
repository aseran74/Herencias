import { describe, expect, it } from 'vitest'
import { calcularSucesion, type Input } from '../domain/succession'
import { redactarBorrador } from './borrador'

function entrada(extra: Partial<Input> = {}): Input {
  return {
    regimen: 'comun',
    situacionConyugal: 'soltero',
    regimenEconomico: 'soltero_viudo',
    inmuebles: [{ id: 'casa', nombre: 'Vivienda', naturaleza: 'privativo', valorCent: 210_000_000, porcentajeCausanteBps: 10_000, cargasCent: 0 }],
    otrosActivos: [],
    deudasCent: 0,
    donaciones: [],
    hijos: [
      { id: 'ana', nombre: 'Ana', vive: true, descendientes: [] },
      { id: 'bruno', nombre: 'Bruno', vive: true, descendientes: [] },
      { id: 'clara', nombre: 'Clara', vive: true, descendientes: [] },
    ],
    beneficiariosLibre: [],
    conyugeViudo: false,
    disposiciones: { mejora: null, libre: null },
    adjudicaciones: [],
    comunidadIsd: null,
    quiereAlbacea: true,
    nombreAlbacea: 'Luis Ortega',
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

describe('borrador notarial', () => {
  it('redacta el testamento con los tercios y el albacea de la simulación', () => {
    const input = entrada()
    const texto = redactarBorrador(input, calcularSucesion(input), 'María Soler')?.flatMap(clausula => clausula.parrafos).join(' ')
    expect(texto).toContain('María Soler')
    expect(texto).toContain('Ana')
    expect(texto).toContain('33,33 %')
    expect(texto).not.toContain('€')
    expect(texto).toContain('Luis Ortega')
    expect(texto).toContain('Vivienda')
  })

  it('no redacta un caso que exige revisión', () => {
    const input = entrada({ regimen: 'cataluna' })
    expect(redactarBorrador(input, calcularSucesion(input))).toBeNull()
  })
})