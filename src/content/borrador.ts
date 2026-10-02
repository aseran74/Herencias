import type { Input, Resultado } from '../domain/succession'

export interface Clausula {
  titulo: string
  parrafos: string[]
}

const REGIMEN_ECONOMICO: Record<Input['regimenEconomico'], string> = {
  gananciales: 'casado en régimen de gananciales',
  separacion_bienes: 'casado en régimen de separación de bienes',
  soltero_viudo: 'soltero o viudo',
}

const TIPO_ACTIVO: Record<Input['otrosActivos'][number]['tipo'], string> = {
  fondo: 'fondo',
  deposito: 'depósito',
  cuenta: 'cuenta',
  otro: 'otro bien',
}

function euros(centimos: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(centimos / 100)
}

function porcentaje(bps: number): string {
  const valor = bps / 100
  return Number.isInteger(valor) ? `${valor} %` : `${valor.toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`
}

function nombreDe(input: Input, resultado: Resultado, id: string): string {
  return resultado.porHeredero.find(persona => persona.herederoId === id)?.nombre
    ?? input.beneficiariosLibre.find(persona => persona.id === id)?.nombre
    ?? input.hijos.find(hijo => hijo.id === id)?.nombre
    ?? input.hijos.flatMap(hijo => hijo.descendientes).find(nieto => nieto.id === id)?.nombre
    ?? 'la persona indicada'
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
  const tercios = resultado.tercios
  const inventario = [
    ...input.inmuebles.map(inmueble =>
      `${inmueble.nombre}, valorado en ${euros(inmueble.valorCent)}, con una participación del causante del ${porcentaje(inmueble.porcentajeCausanteBps)}${inmueble.cargasCent ? ` y cargas de ${euros(inmueble.cargasCent)}` : ''}.`),
    ...input.otrosActivos.map(activo =>
      `${TIPO_ACTIVO[activo.tipo]}, valorado en ${euros(activo.valorCent)}, con una participación del causante del ${porcentaje(activo.porcentajeCausanteBps)}.`),
  ]
  if (input.deudasCent > 0) inventario.push(`Deudas declaradas: ${euros(input.deudasCent)}.`)

  const herederos = resultado.porHeredero.map(persona =>
    `${persona.nombre} recibe ${euros(persona.totalCent)}: ${euros(persona.estrictaCent)} de legítima estricta, ${euros(persona.mejoraCent)} de mejora y ${euros(persona.libreCent)} de libre disposición.`)

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

  const adjudicacion = input.inmuebles.flatMap((inmueble) => {
    const partes = input.adjudicaciones.filter(fila => fila.inmuebleId === inmueble.id && fila.bps > 0)
    if (!partes.length) return [`${inmueble.nombre} queda pendiente de adjudicar.`]
    return partes.map(parte =>
      `${inmueble.nombre} se adjudica a ${nombreDe(input, resultado, parte.herederoId)} en un ${porcentaje(parte.bps)}.`)
  })

  const clausulas: Clausula[] = [
    {
      titulo: 'Advertencia',
      parrafos: ['Este texto recoge las condiciones de la simulación para que el notario redacte el testamento abierto. No es escritura, no produce efectos y debe revisarlo el despacho antes de la firma.'],
    },
    {
      titulo: 'Primera. Comparecencia',
      parrafos: [
        `En ______________, a ____ de ______________ de ________.`,
        `Ante mí, notario, comparece ${quien}, mayor de edad, ${REGIMEN_ECONOMICO[input.regimenEconomico]}, con vecindad civil común. Manifiesta que otorga testamento abierto conforme al derecho común español.`,
      ],
    },
    {
      titulo: 'Segunda. Inventario declarado',
      parrafos: [
        ...inventario,
        `El caudal hereditario orientativo de la simulación es ${euros(resultado.caudalCent)}. Los valores son los declarados por el otorgante; el notario los contrastará.`,
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
      parrafos: [`El tercio de legítima estricta asciende a ${euros(tercios.estrictaCent)} y se atribuye por partes iguales entre las estirpes.`],
    },
    {
      titulo: 'Quinta. Mejora',
      parrafos: [`El tercio de mejora asciende a ${euros(tercios.mejoraCent)}.`, ...mejora],
    },
    {
      titulo: 'Sexta. Libre disposición',
      parrafos: [`El tercio de libre disposición asciende a ${euros(tercios.libreCent)}.`, ...libre],
    },
  ]

  if (adjudicacion.length) {
    clausulas.push({
      titulo: 'Séptima. Adjudicación de inmuebles',
      parrafos: [
        ...adjudicacion,
        resultado.patrimonioPendienteAdjudicarCent > 0
          ? `Queda pendiente de adjudicar ${euros(resultado.patrimonioPendienteAdjudicarCent)}.`
          : 'La adjudicación indicada cubre los inmuebles declarados.',
        resultado.adjudicacion.some(fila => fila.diferenciaCent !== 0)
          ? 'Las diferencias de valor entre lo adjudicado y el derecho de cada heredero podrán compensarse en metálico, conforme aprecie el notario.'
          : 'No se aprecian diferencias de valor en la adjudicación declarada.',
      ],
    })
  }

  if (input.conyugeViudo) {
    clausulas.push({
      titulo: 'Cónyuge viudo',
      parrafos: ['Se hace constar que el cónyuge viudo puede tener el usufructo del tercio de mejora. Este borrador no lo valora; lo fijará el notario.'],
    })
  }

  clausulas.push({
    titulo: 'Albacea',
    parrafos: [
      input.quiereAlbacea && input.nombreAlbacea.trim()
        ? `Nombra albacea a ${input.nombreAlbacea.trim()}, para que cumpla este testamento con las facultades ordinarias de la ley.`
        : 'No nombra albacea.',
    ],
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
