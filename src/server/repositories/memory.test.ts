import { describe, expect, it } from 'vitest'
import { calcularSucesion, type Input } from '../../domain/succession'
import { InMemoryLeadRepository, InMemoryTenantRepository } from './memory'

const input: Input = {
  regimen: 'comun',
  situacionConyugal: 'soltero',
  regimenEconomico: 'soltero_viudo',
  inmuebles: [],
  otrosActivos: [{ id: 'c', tipo: 'cuenta', naturaleza: 'privativo', valorCent: 18_000_000, porcentajeCausanteBps: 10_000 }],
  deudasCent: 0,
  donaciones: [],
  hijos: [{ id: 'ana', nombre: 'Ana', vive: true, descendientes: [] }],
  tieneHijos: true,
  destinosColaterales: { sobrinos: false, nietos: false, familiarCercano: false, ong: false },
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

describe('adapters en memoria', () => {
  it('guarda un lead y solo lo devuelve dentro de su despacho', async () => {
    const leads = new InMemoryLeadRepository()
    const guardado = await leads.save({
      tenantId: 'despacho-demo',
      contacto: {
        nombre: 'Ana Rivas',
        email: 'ana@example.com',
        telefono: '600123123',
        consentimiento_rgpd: true,
      },
      input,
      resultado: calcularSucesion(input),
      citaExpress: true,
      notaExpress: 'Cita por la mañana',
    })

    expect(guardado.id).toBeTruthy()
    expect(guardado.citaExpress).toBe(true)
    expect(guardado.notaExpress).toBe('Cita por la mañana')
    expect(await leads.findById('despacho-demo', guardado.id)).toMatchObject({ id: guardado.id })
    expect(await leads.findById('otro-despacho', guardado.id)).toBeNull()
  })

  it('encuentra el despacho sembrado y no uno desconocido', async () => {
    const tenants = new InMemoryTenantRepository([{ id: 'despacho-demo', nombre: 'Despacho demo' }])
    expect(await tenants.findById('despacho-demo')).toMatchObject({ nombre: 'Despacho demo' })
    expect(await tenants.findById('nadie')).toBeNull()
  })
})
