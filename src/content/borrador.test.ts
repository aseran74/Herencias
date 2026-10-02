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
    tieneHijos: true,
    destinosColaterales: { sobrinos: false, nietos: false, familiarCercano: false },
    beneficiariosLibre: [],
    conyugeViudo: false,
    disposiciones: { mejora: null, libre: null },
    adjudicaciones: [],
    comunidadIsd: null,
    quiereAlbacea: true,
    nombreAlbacea: 'Luis Ortega',
    facultadesAlbacea: {
      informacionBancaria: true,
      gestionarPagos: true,
      pagarDeudasImpuestos: true,
      conservarBienes: true,
    },
    atribucionEstricta: { tipo: 'inmueble', inmuebleId: 'casa' },
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
    expect(texto).toContain('cuentas del causante')
    expect(texto).toContain('Vivienda')
    expect(texto).toContain('herederos legitimarios')
  })

  it('instituye a tres sobrinos cuando no hay descendientes', () => {
    const input = entrada({
      tieneHijos: false,
      hijos: [],
      destinosColaterales: { sobrinos: true, nietos: false, familiarCercano: false },
      beneficiariosLibre: [
        { id: 's1', nombre: 'Luis', tipo: 'persona', parentesco: 'cercano', rol: 'sobrino' },
        { id: 's2', nombre: 'Marta', tipo: 'persona', parentesco: 'cercano', rol: 'sobrino' },
        { id: 's3', nombre: 'Elena', tipo: 'persona', parentesco: 'cercano', rol: 'sobrino' },
      ],
      atribucionEstricta: { tipo: null, inmuebleId: null },
    })
    const texto = redactarBorrador(input, calcularSucesion(input), 'Pedro Gil')?.flatMap(clausula => clausula.parrafos).join(' ')
    expect(texto).toContain('no tiene descendientes')
    expect(texto).toContain('Luis')
    expect(texto).toContain('Marta')
    expect(texto).toContain('Elena')
    expect(texto).toContain('libre disposición')
    expect(texto).not.toContain('herederos legitimarios')
  })

  it('no redacta un caso que exige revisión', () => {
    const input = entrada({ regimen: 'cataluna' })
    expect(redactarBorrador(input, calcularSucesion(input))).toBeNull()
  })
})