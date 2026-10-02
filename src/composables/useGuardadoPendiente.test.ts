/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { borrarPendiente, guardarPendiente, leerPendiente } from './useGuardadoPendiente'
import type { Input } from '../domain/succession'

const input: Input = {
  regimen: 'comun',
  situacionConyugal: 'soltero',
  regimenEconomico: 'soltero_viudo',
  inmuebles: [],
  otrosActivos: [],
  deudasCent: 0,
  donaciones: [],
  hijos: [],
  tieneHijos: null,
  destinosColaterales: { sobrinos: false, nietos: false, familiarCercano: false },
  beneficiariosLibre: [],
  conyugeViudo: false,
  disposiciones: { mejora: null, libre: null },
  adjudicaciones: [],
  comunidadIsd: null,
  quiereAlbacea: null,
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

describe('guardado pendiente', () => {
  beforeEach(() => sessionStorage.clear())

  it('conserva una simulación válida durante el acceso', () => {
    guardarPendiente({ titulo: 'Caso familiar', input, paso: 11 })
    expect(leerPendiente()).toEqual({ titulo: 'Caso familiar', input, paso: 11 })
  })

  it('descarta contenido manipulado y permite borrarlo', () => {
    sessionStorage.setItem('herencias:guardado-pendiente', '{"titulo":"Caso","input":{},"paso":11}')
    expect(leerPendiente()).toBeNull()
    borrarPendiente()
    expect(sessionStorage.length).toBe(0)
  })
})
