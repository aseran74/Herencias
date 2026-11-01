import { describe, expect, it } from 'vitest'
import { calcularSucesion, type Input } from '../domain/succession'
import { redactarBorrador, redactarClausulaUsufructo } from './borrador'

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
    destinosColaterales: { hermanos: false, sobrinos: false, nietos: false, familiarCercano: false, ong: false },
    beneficiariosLibre: [],
    conyugeViudo: false,
    disposiciones: { mejora: null, libre: null },
    adjudicaciones: [],
    usufructoInmueble: { activo: false, inmuebleId: null, usufructuarioId: null, nudaPropiedadIds: [] },
    condicionesEspeciales: {
      fiducia: false,
      sustitucion: false,
      legadoCondicionado: false,
      inalienabilidad: false,
      otra: false,
      texto: '',
    },
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
    const texto = redactarBorrador(input, calcularSucesion(input), {
      nombre: 'María Soler',
      dni: '12345678A',
      domicilio: 'Calle Mayor 1',
      localidad: 'Madrid',
    })?.flatMap(clausula => clausula.parrafos).join(' ')
    expect(texto).toContain('María Soler')
    expect(texto).toContain('DNI/NIE 12345678A')
    expect(texto).toContain('Calle Mayor 1')
    expect(texto).toContain('Madrid')
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
      destinosColaterales: { hermanos: false, sobrinos: true, nietos: false, familiarCercano: false, ong: false },
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

  it('instituye a una ONG cuando no hay descendientes', () => {
    const input = entrada({
      tieneHijos: false,
      hijos: [],
      destinosColaterales: { hermanos: false, sobrinos: false, nietos: false, familiarCercano: false, ong: true },
      beneficiariosLibre: [
        { id: 'ong', nombre: 'Cruz Roja', tipo: 'entidad', parentesco: 'ajeno', rol: 'ong' },
      ],
      atribucionEstricta: { tipo: null, inmuebleId: null },
    })
    const texto = redactarBorrador(input, calcularSucesion(input), 'Pedro Gil')?.flatMap(clausula => clausula.parrafos).join(' ')
    expect(texto).toContain('Cruz Roja')
    expect(texto).toContain('ONG')
  })

  it('no redacta un caso que exige revisión', () => {
    const input = entrada({ regimen: 'cataluna' })
    expect(redactarBorrador(input, calcularSucesion(input))).toBeNull()
  })

  it('incluye el usufructo de un inmueble en la redacción final sin euros', () => {
    const input = entrada({
      usufructoInmueble: {
        activo: true,
        inmuebleId: 'casa',
        usufructuarioId: 'ana',
        nudaPropiedadIds: ['bruno', 'clara'],
      },
    })
    const clausulas = redactarBorrador(input, calcularSucesion(input), 'Pedro Gil')
    const titulos = clausulas?.map(clausula => clausula.titulo).join(' ') ?? ''
    const texto = clausulas?.flatMap(clausula => clausula.parrafos).join(' ') ?? ''
    expect(titulos).toMatch(/Legado de usufructo/)
    expect(texto).toContain('usufructo vitalicio')
    expect(texto).toContain('Vivienda')
    expect(texto).toContain('Ana')
    expect(texto).toContain('Bruno')
    expect(texto).toContain('Clara')
    expect(texto).toContain('sujeto al usufructo vitalicio dispuesto más adelante')
    expect(texto).not.toContain('€')
  })

  it('no redacta el testamento completo cuando hay condiciones especiales, pero sí la cláusula de usufructo', () => {
    const input = entrada({
      condicionesEspeciales: {
        fiducia: false,
        sustitucion: true,
        legadoCondicionado: false,
        inalienabilidad: false,
        otra: false,
        texto: 'Sustitución vulgar a favor de los nietos',
      },
      usufructoInmueble: {
        activo: true,
        inmuebleId: 'casa',
        usufructuarioId: 'ana',
        nudaPropiedadIds: [],
      },
    })
    expect(redactarBorrador(input, calcularSucesion(input))).toBeNull()
    const clausula = redactarClausulaUsufructo(input, calcularSucesion(input))
    expect(clausula?.parrafos.join(' ')).toContain('usufructo vitalicio')
    expect(clausula?.parrafos.join(' ')).toContain('Ana')
  })
})