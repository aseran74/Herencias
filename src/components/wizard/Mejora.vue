<script setup lang="ts">
import { computed } from 'vue'
import { useWizardStore } from '../../stores/wizard'
const store = useWizardStore()
const personalizada = computed({
  get: () => store.input.disposiciones.mejora !== null,
  set: (valor: boolean) => {
    store.input.disposiciones.mejora = valor
      ? store.descendientes.map(persona => ({ herederoId: persona.id, bps: 0 }))
      : null
  },
})
const suma = computed(() => store.input.disposiciones.mejora?.reduce((total, item) => total + item.bps, 0) ?? 10000)
function porcentaje(bps: number) {
  return Math.round(bps / 100)
}
function fijarPorcentaje(reparto: { bps: number }, valor: string) {
  const porcentajeElegido = Math.min(100, Math.max(0, Math.round(Number(valor) || 0)))
  reparto.bps = porcentajeElegido * 100
}
</script>

<template>
  <section aria-labelledby="titulo-mejora">
    <p class="kicker">06 · Tercio de mejora</p>
    <h2 id="titulo-mejora">Mejorar a uno o varios descendientes</h2>
    <label class="interruptor"><input v-model="personalizada" type="checkbox"> Quiero decidir el reparto de la mejora</label>
    <p v-if="!personalizada" class="nota">Sin disposición: se reparte por estirpes.</p>
    <div v-else class="porcentajes">
      <label v-for="(reparto, indice) in store.input.disposiciones.mejora" :key="reparto.herederoId">
        <span class="reparto-cabecera">
          <strong>{{ store.descendientes.find(p => p.id === reparto.herederoId)?.nombre }}</strong>
          <b>{{ porcentaje(reparto.bps) }} %</b>
        </span>
        <input
          :value="porcentaje(reparto.bps)"
          type="range"
          min="0"
          max="100"
          step="1"
          :aria-valuetext="`${porcentaje(reparto.bps)} por ciento`"
          :data-testid="`mejora-${indice}`"
          @input="fijarPorcentaje(reparto, ($event.target as HTMLInputElement).value)"
        >
      </label>
      <p :class="{ alerta: suma !== 10000 }" aria-live="polite">Total: {{ porcentaje(suma) }} %</p>
    </div>
  </section>
</template>
