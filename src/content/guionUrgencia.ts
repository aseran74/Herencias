import type { Input, Resultado } from '../domain/succession'

function porcentajeDe(parte: number, total: number): string {
  if (total <= 0 || parte <= 0) return '0 %'
  const centesimas = Math.round((parte * 10_000) / total)
  const enteros = Math.floor(centesimas / 100)
  const decimales = centesimas % 100
  return decimales === 0 ? `${enteros} %` : `${enteros},${String(decimales).padStart(2, '0')} %`
}

export function redactarGuionUrgencia(
  input: Input,
  resultado: Resultado,
  otorgante = '',
  lugar = '',
): string {
  const quien = otorgante.trim() || '________________________________'
  const donde = lugar.trim() || 'fuera de España, lejos de un notario español'
  const caudal = resultado.caudalCent

  const lineas = [
    `Me llamo ${quien}. Estoy en ${donde}. Temo no llegar a tiempo a un notario o cónsul español.`,
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

  if (input.quiereAlbacea && input.nombreAlbacea.trim()) {
    lineas.push(`Nombro albacea a ${input.nombreAlbacea.trim()}.`)
  }

  lineas.push('Si vivo, pido que un notario o el cónsul español eleve esto a testamento. Si muero, pido que se use como prueba de mi voluntad y se protocolice cuanto antes.')
  return lineas.join(' ')
}
