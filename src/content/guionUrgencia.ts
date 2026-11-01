import type { Input, Resultado } from '../domain/succession'
import { nombreOtorgante, type DatosOtorgante } from './otorgante'

function porcentajeDe(parte: number, total: number): string {
  if (total <= 0 || parte <= 0) return '0 %'
  const centesimas = Math.round((parte * 10_000) / total)
  const enteros = Math.floor(centesimas / 100)
  const decimales = centesimas % 100
  return decimales === 0 ? `${enteros} %` : `${enteros},${String(decimales).padStart(2, '0')} %`
}

function normalizarOtorgante(otorgante: DatosOtorgante | string): DatosOtorgante {
  if (typeof otorgante === 'string') {
    return { nombre: otorgante, dni: '', domicilio: '', localidad: '' }
  }
  return otorgante
}

export function redactarGuionUrgencia(
  input: Input,
  resultado: Resultado,
  otorgante: DatosOtorgante | string = '',
  lugar = '',
): string {
  const datos = normalizarOtorgante(otorgante)
  const quien = nombreOtorgante(datos) || '________________________________'
  const dni = datos.dni.trim()
  const domicilio = [datos.domicilio.trim(), datos.localidad.trim()].filter(Boolean).join(', ')
  const donde = lugar.trim() || 'fuera de España, lejos de un notario español'
  const caudal = resultado.caudalCent

  const lineas = [
    `Me llamo ${quien}.${dni ? ` Mi DNI o NIE es ${dni}.` : ''}${domicilio ? ` Mi domicilio es ${domicilio}.` : ''} Estoy en ${donde}. Temo no llegar a tiempo a un notario o cónsul español.`,
    'Declaro que esta grabación y este texto recogen mi última voluntad sobre mi herencia. Sé que no sustituyen por sí solos un testamento notarial.',
  ]

  if (resultado.porHeredero.length && caudal) {
    lineas.push('Quiero que mi caudal se reparta así:')
    for (const persona of resultado.porHeredero) {
      lineas.push(`${persona.nombre} recibe el ${porcentajeDe(persona.totalCent, caudal)} del caudal.`)
    }
  } else {
    lineas.push('Pido al despacho que protocolice de urgencia el reparto que he indicado en esta simulación.')
  }

  const usufructo = input.usufructoInmueble
  if (usufructo.activo && usufructo.inmuebleId && usufructo.usufructuarioId) {
    const bien = input.inmuebles.find(item => item.id === usufructo.inmuebleId)?.nombre ?? 'un inmueble'
    const usufructuario = input.beneficiariosLibre.find(persona => persona.id === usufructo.usufructuarioId)?.nombre
      ?? input.hijos.find(hijo => hijo.id === usufructo.usufructuarioId)?.nombre
      ?? input.hijos.flatMap(hijo => hijo.descendientes).find(nieto => nieto.id === usufructo.usufructuarioId)?.nombre
      ?? 'la persona indicada'
    const nuda = usufructo.nudaPropiedadIds.length
      ? usufructo.nudaPropiedadIds.map((id) =>
        input.beneficiariosLibre.find(persona => persona.id === id)?.nombre
          ?? input.hijos.find(hijo => hijo.id === id)?.nombre
          ?? input.hijos.flatMap(hijo => hijo.descendientes).find(nieto => nieto.id === id)?.nombre
          ?? id,
      ).join(', ')
      : 'los herederos de este testamento'
    lineas.push(`Dejo el usufructo de ${bien} a ${usufructuario}, y la nuda propiedad a ${nuda}.`)
  }

  if (input.quiereAlbacea && input.nombreAlbacea.trim()) {
    lineas.push(`Nombro albacea a ${input.nombreAlbacea.trim()}.`)
  }

  lineas.push('Si vivo, pido que un notario o el cónsul español eleve esto a testamento. Si muero, pido que se use como prueba de mi voluntad y se protocolice cuanto antes.')
  return lineas.join(' ')
}
