import { parrafosAlbacea } from './albacea'
import type { Input, Resultado } from '../domain/succession'

export interface Clausula {
  titulo: string
  parrafos: string[]
}

const REGIMEN_ECONOMICO: Record<Input['regimenEconomico'], string> = {
  gananciales: 'régimen de gananciales',
  separacion_bienes: 'régimen de separación de bienes',
  soltero_viudo: 'sin régimen económico matrimonial vigente',
}

const TIPO_ACTIVO: Record<Input['otrosActivos'][number]['tipo'], string> = {
  fondo: 'fondo',
  deposito: 'depósito',
  cuenta: 'cuenta',
  otro: 'otro bien',
}

function porcentaje(bps: number): string {
  const valor = bps / 100
  return Number.isInteger(valor) ? `${valor} %` : `${valor.toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`
}

function porcentajeDe(parte: number, total: number): string {
  if (total <= 0 || parte <= 0) return '0 %'
  const centesimas = Math.round((parte * 10_000) / total)
  const enteros = Math.floor(centesimas / 100)
  const decimales = centesimas % 100
  return decimales === 0 ? `${enteros} %` : `${enteros},${String(decimales).padStart(2, '0')} %`
}

function nombreDe(input: Input, resultado: Resultado, id: string): string {
  return resultado.porHeredero.find(persona => persona.herederoId === id)?.nombre
    ?? input.beneficiariosLibre.find(persona => persona.id === id)?.nombre
    ?? input.hijos.find(hijo => hijo.id === id)?.nombre
    ?? input.hijos.flatMap(hijo => hijo.descendientes).find(nieto => nieto.id === id)?.nombre
    ?? 'la persona indicada'
}

function situacionPersonal(input: Input): string {
  if (input.situacionConyugal === 'conyuge_vivo') {
    return `casado y con su cónyuge vivo, en ${REGIMEN_ECONOMICO[input.regimenEconomico]}`
  }
  if (input.situacionConyugal === 'viudo') {
    return 'viudo'
  }
  if (input.situacionConyugal === 'separado_divorciado') return 'divorciado o separado'
  if (input.situacionConyugal === 'soltero') return 'soltero'
  return REGIMEN_ECONOMICO[input.regimenEconomico]
}

function estirpes(input: Input): string[] {
  return input.hijos.flatMap((hijo) => {
    if (hijo.vive) return [`${hijo.nombre}, descendiente vivo.`]
    if (!hijo.descendientes.length) return []
    const nietos = hijo.descendientes.map(nieto => nieto.nombre).join(', ')
    return [`La estirpe de ${hijo.nombre}, premuerto, representada por ${nietos}.`]
  })
}

export function redactarBorrador(input: Input, resultado: Resultado, otorgante = ''): Clausula[] | null {
  if ((resultado.estado !== 'ok' && resultado.estado !== 'ok_con_avisos') || !resultado.tercios || resultado.caudalCent === null) {
    return null
  }

  const quien = otorgante.trim() || '________________________________'
  const caudal = resultado.caudalCent
  const inventario = [
    ...input.inmuebles.map(inmueble =>
      `${inmueble.nombre}, en la participación del causante del ${porcentaje(inmueble.porcentajeCausanteBps)}${inmueble.cargasCent ? ', con las cargas que tenga al tiempo de la partición' : ''}.`),
    ...input.otrosActivos.map(activo =>
      `${TIPO_ACTIVO[activo.tipo]}, en la participación del causante del ${porcentaje(activo.porcentajeCausanteBps)}.`),
  ]
  if (input.deudasCent > 0) inventario.push('Las deudas se restan del caudal por el importe que tengan al tiempo del fallecimiento.')

  const herederos = resultado.porHeredero.map((persona) => {
    const partes = [
      persona.estrictaCent ? `${porcentajeDe(persona.estrictaCent, caudal)} de legítima estricta` : '',
      persona.mejoraCent ? `${porcentajeDe(persona.mejoraCent, caudal)} de mejora` : '',
      persona.libreCent ? `${porcentajeDe(persona.libreCent, caudal)} de libre disposición` : '',
    ].filter(Boolean)
    return `${persona.nombre} recibe el ${porcentajeDe(persona.totalCent, caudal)} del caudal${partes.length ? `: ${partes.join(', ')}` : ''}.`
  })

  const mejora = input.disposiciones.mejora === null
    ? ['El tercio de mejora no se asignó de forma distinta, así que se reparte por igual entre las estirpes.']
    : input.disposiciones.mejora
      .filter(reparto => reparto.bps > 0)
      .map(reparto => `${nombreDe(input, resultado, reparto.herederoId)} recibe el ${porcentaje(reparto.bps)} del tercio de mejora.`)

  const libre = input.disposiciones.libre === null
    ? ['El tercio de libre disposición no se asignó a otra persona, así que se reparte por igual entre las estirpes.']
    : input.disposiciones.libre
      .filter(reparto => reparto.bps > 0)
      .map((reparto) => {
        const beneficiario = input.beneficiariosLibre.find(persona => persona.id === reparto.herederoId)
        const calidad = beneficiario?.tipo === 'entidad' ? 'La entidad' : 'La persona'
        return `${calidad} ${nombreDe(input, resultado, reparto.herederoId)} recibe el ${porcentaje(reparto.bps)} del tercio de libre disposición.`
      })

  const estrictaTexto = ['La legítima estricta es un tercio del caudal y se atribuye por partes iguales entre las estirpes.']
  const bienEstricta = input.inmuebles.find(inmueble => inmueble.id === input.atribucionEstricta.inmuebleId)
  if (input.atribucionEstricta.tipo === 'inmueble' && bienEstricta) {
    estrictaTexto.push(`En pago de esa estricta atribuye ${bienEstricta.nombre} a los herederos legitimarios, por estirpes. Si al partir el valor de mercado no cubre o excede este tercio, la diferencia se compensará en metálico.`)
  }
  if (input.atribucionEstricta.tipo === 'alquiler' && bienEstricta) {
    estrictaTexto.push(`Atribuye las rentas de alquiler de ${bienEstricta.nombre} a los herederos legitimarios, por estirpes. El inmueble permanece en el caudal, salvo otra adjudicación.`)
  }

  const adjudicacion = input.inmuebles.flatMap((inmueble) => {
    const partes = input.adjudicaciones.filter(fila => fila.inmuebleId === inmueble.id && fila.bps > 0)
    if (!partes.length) return [`${inmueble.nombre} queda pendiente de adjudicar.`]
    return partes.map(parte =>
      `${inmueble.nombre} se adjudica a ${nombreDe(input, resultado, parte.herederoId)} en un ${porcentaje(parte.bps)}.`)
  })

  const clausulas: Clausula[] = [
    {
      titulo: 'Advertencia',
      parrafos: ['Este texto fija las cuotas en porcentaje, no en euros, porque el valor de mercado puede cambiar. No es escritura y el despacho debe revisarlo antes de la firma.'],
    },
    {
      titulo: 'Primera. Comparecencia',
      parrafos: [
        `En ______________, a ____ de ______________ de ________.`,
        `Ante mí, notario, comparece ${quien}, mayor de edad, ${situacionPersonal(input)}, con vecindad civil común. Manifiesta que otorga testamento abierto conforme al derecho común español.`,
      ],
    },
    {
      titulo: 'Segunda. Inventario declarado',
      parrafos: [
        'Los bienes se identifican aquí. Su valor será el de mercado al tiempo de la partición, no el usado en la simulación.',
        ...inventario,
      ],
    },
    {
      titulo: 'Tercera. Institución de herederos',
      parrafos: [
        'Instituye herederos a sus descendientes por estirpes:',
        ...estirpes(input),
        ...herederos,
      ],
    },
    {
      titulo: 'Cuarta. Legítima estricta',
      parrafos: estrictaTexto,
    },
    {
      titulo: 'Quinta. Mejora',
      parrafos: ['La mejora es un tercio del caudal.', ...mejora],
    },
    {
      titulo: 'Sexta. Libre disposición',
      parrafos: ['La libre disposición es un tercio del caudal.', ...libre],
    },
  ]

  if (adjudicacion.length) {
    clausulas.push({
      titulo: 'Séptima. Adjudicación de inmuebles',
      parrafos: [
        ...adjudicacion,
        resultado.patrimonioPendienteAdjudicarCent > 0
          ? 'Lo que no quede adjudicado se reparte conforme a las cuotas de este testamento.'
          : 'La adjudicación indicada cubre los inmuebles declarados.',
        'Si al partir, el valor de mercado de lo adjudicado no coincide con la cuota, la diferencia se compensará en metálico.',
      ],
    })
  }

  if (resultado.parteConyugeGanancialCent > 0) {
    clausulas.push({
      titulo: 'Liquidación de gananciales',
      parrafos: ['La mitad neta de los bienes identificados como gananciales corresponde al cónyuge y queda fuera de la herencia. Solo la mitad atribuible al causante integra el caudal hereditario.'],
    })
  }

  if (input.situacionConyugal === 'conyuge_vivo') {
    clausulas.push({
      titulo: 'Cónyuge viudo',
      parrafos: ['Se reconoce al cónyuge no separado el usufructo legal del tercio de mejora. Este borrador define la base en porcentaje, pero no valora económicamente el usufructo; lo concretará el notario.'],
    })
  }

  clausulas.push({
    titulo: 'Albacea',
    parrafos: input.quiereAlbacea && input.nombreAlbacea.trim()
      ? parrafosAlbacea(input.nombreAlbacea.trim(), input.facultadesAlbacea)
      : ['No nombra albacea.'],
  })

  clausulas.push({
    titulo: 'Cierre',
    parrafos: [
      'Así lo dice y otorga. El notario completará la identidad, las advertencias legales, la lectura y las firmas.',
      'Firma del otorgante: ________________________________',
      'Firma del notario: ________________________________',
    ],
  })

  return clausulas
}
