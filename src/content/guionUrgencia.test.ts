import { describe, expect, it } from 'vitest'
import { calcularSucesion, type Input } from '../domain/succession'
import { redactarGuionUrgencia } from './guionUrgencia'

const input: Input = {
  regimen: 'comun',
  situacionConyugal: 'soltero',
  regimenEconomico: 'soltero_viudo',
  inmuebles: [],
  otrosActivos: [{ id: 'c', tipo: 'cuenta', naturaleza: 'privativo', valorCent: 210_000_000, porcentajeCausanteBps: 10_000 }],
  deudasCent: 0,
  donaciones: [],
  hijos: [],
  tieneHijos: false,
  destinosColaterales: { hermanos: false, sobrinos: true, nietos: false, familiarCercano: false, ong: false },
  beneficiariosLibre: [
    { id: 's1', nombre: 'Luis', tipo: 'persona', parentesco: 'cercano', rol: 'sobrino' },
    { id: 's2', nombre: 'Marta', tipo: 'persona', parentesco: 'cercano', rol: 'sobrino' },
    { id: 's3', nombre: 'Elena', tipo: 'persona', parentesco: 'cercano', rol: 'sobrino' },
  ],
  conyugeViudo: false,
  disposiciones: { mejora: null, libre: null },
  adjudicaciones: [],
  comunidadIsd: null,
  quiereAlbacea: false,
  nombreAlbacea: '',
  facultadesAlbacea: {
    informacionBancaria: false,
    gestionarPagos: false,
    pagarDeudasImpuestos: false,
    conservarBienes: false,
  },
  atribucionEstricta: { tipo: null, inmuebleId: null },
  flags: {
    testamentoAnterior: false,
    hijoConDiscapacidad: false,
    desheredacion: false,
    empresaFamiliar: false,
    bienesExtranjero: false,
    pactoSucesorio: false,
  },
}

describe('guion de urgencia', () => {
  it('redacta un texto en primera persona para leerlo en cámara', () => {
    const texto = redactarGuionUrgencia(input, calcularSucesion(input), 'Pedro Gil', 'Hanói, Vietnam')
    expect(texto).toContain('Pedro Gil')
    expect(texto).toContain('Hanói')
    expect(texto).toContain('Luis')
    expect(texto).toContain('no sustituyen')
    expect(texto).not.toContain('€')
  })
})
