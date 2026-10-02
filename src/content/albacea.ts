import type { FacultadesAlbacea } from '../domain/succession'

export const FACULTADES_ALBACEA = [
  {
    id: 'informacionBancaria',
    texto: 'Solicitar a los bancos los saldos, movimientos y certificados de las cuentas del causante.',
  },
  {
    id: 'gestionarPagos',
    texto: 'Operar en esas cuentas solo para cobros y pagos necesarios de la herencia.',
  },
  {
    id: 'pagarDeudasImpuestos',
    texto: 'Pagar gastos funerarios, deudas, impuestos y gastos de la herencia con cargo a ella.',
  },
  {
    id: 'conservarBienes',
    texto: 'Conservar, custodiar y administrar de forma ordinaria los bienes.',
  },
] as const

export function facultadesIniciales(): FacultadesAlbacea {
  return {
    informacionBancaria: true,
    gestionarPagos: true,
    pagarDeudasImpuestos: true,
    conservarBienes: true,
  }
}

export function parrafosAlbacea(nombre: string, facultades: FacultadesAlbacea): string[] {
  const marcadas = FACULTADES_ALBACEA
    .filter(facultad => facultades[facultad.id])
    .map(facultad => facultad.texto)
  const intro = `Nombra albacea a ${nombre}, para que cumpla este testamento.`
  if (!marcadas.length) {
    return [`${intro} Se limita a las facultades ordinarias de la ley, sin autorización expresa sobre cuentas.`]
  }
  return [
    intro,
    'Le confiere, además, estas facultades expresas de administración, que no equivalen a entregar contraseñas ni a un acceso personal ilimitado:',
    ...marcadas,
    'No se autoriza a vender bienes, cambiar el reparto ni actuar como contador-partidor, salvo que el notario lo complete.',
  ]
}
