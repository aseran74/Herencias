import type { Reparto } from './types'

export const BPS_TOTAL = 10_000

export function aplicarBps(importeCent: number, bps: number): number {
  if (!Number.isSafeInteger(importeCent) || !Number.isSafeInteger(bps)) {
    return 0
  }
  return Number((BigInt(importeCent) * BigInt(bps)) / BigInt(BPS_TOTAL))
}

export function repartirIgual(
  importeCent: number,
  ids: readonly string[],
): Map<string, number> {
  const resultado = new Map<string, number>()
  if (ids.length === 0) return resultado

  const base = Math.floor(importeCent / ids.length)
  let resto = importeCent - base * ids.length

  for (const id of ids) {
    const extra = resto > 0 ? 1 : 0
    resultado.set(id, (resultado.get(id) ?? 0) + base + extra)
    resto -= extra
  }

  return resultado
}

export function repartirPorBps(
  importeCent: number,
  reparto: readonly Reparto[],
): Map<string, number> {
  const resultado = new Map<string, number>()
  const sumaBps = reparto.reduce((total, item) => total + item.bps, 0)
  const objetivo = aplicarBps(importeCent, sumaBps)
  let asignado = 0

  for (const item of reparto) {
    const importe = aplicarBps(importeCent, item.bps)
    resultado.set(
      item.herederoId,
      (resultado.get(item.herederoId) ?? 0) + importe,
    )
    asignado += importe
  }

  let resto = objetivo - asignado
  for (let indice = 0; resto > 0 && reparto.length > 0; indice += 1) {
    const id = reparto[indice % reparto.length]!.herederoId
    resultado.set(id, (resultado.get(id) ?? 0) + 1)
    resto -= 1
  }

  return resultado
}

export function sumarMapas(
  destino: Map<string, number>,
  origen: ReadonlyMap<string, number>,
): void {
  for (const [id, importe] of origen) {
    destino.set(id, (destino.get(id) ?? 0) + importe)
  }
}
