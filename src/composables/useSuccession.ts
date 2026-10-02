import { computed, type Ref } from 'vue'
import { calcularSucesion, type Input } from '../domain/succession'

export function eurosACentimos(valor: string): number | null {
  const limpio = valor.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  if (!/^\d+(?:\.\d{0,2})?$/.test(limpio)) return null
  const [enteros, decimales = ''] = limpio.split('.')
  const centimos = Number(enteros) * 100 + Number(decimales.padEnd(2, '0'))
  return Number.isSafeInteger(centimos) ? centimos : null
}

export function centimosAEuros(valor: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(valor / 100)
}

export function useSuccession(input: Ref<Input>) {
  const resultado = computed(() => calcularSucesion(input.value))
  return { resultado }
}
