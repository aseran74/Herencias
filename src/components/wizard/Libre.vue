<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardStore } from '../../stores/wizard'
const store = useWizardStore()
const nombre = ref('')
const tipo = ref<'persona' | 'entidad'>('persona')
const parentesco = ref<'descendiente' | 'cercano' | 'ajeno'>('descendiente')
const personalizada = computed({
  get: () => store.input.disposiciones.libre !== null,
  set: (valor: boolean) => {
    store.input.disposiciones.libre = valor
      ? store.beneficiarios.map(persona => ({ herederoId: persona.id, bps: 0 }))
      : null
  },
})
const suma = computed(() => store.input.disposiciones.libre?.reduce((total, item) => total + item.bps, 0) ?? 10000)
function porcentaje(bps: number) {
  return Math.round(bps / 100)
}
function fijarPorcentaje(reparto: { bps: number }, valor: string) {
  const porcentajeElegido = Math.min(100, Math.max(0, Math.round(Number(valor) || 0)))
  reparto.bps = porcentajeElegido * 100
}
function ficha(id: string) {
  return store.input.beneficiariosLibre.find(persona => persona.id === id)
}
function marcar(id: string, valor: string) {
  const persona = ficha(id)
  if (!persona) return
  persona.parentesco = valor === 'descendiente' || valor === 'cercano' ? valor : 'ajeno'
}
function anadir() {
  if (!nombre.value.trim()) return
  const id = `libre-${crypto.randomUUID()}`
  store.input.beneficiariosLibre.push({
    id,
    nombre: nombre.value.trim(),
    tipo: tipo.value,
    parentesco: tipo.value === 'persona' ? parentesco.value : 'ajeno',
  })
  store.input.disposiciones.libre?.push({ herederoId: id, bps: 0 })
  nombre.value = ''
}
</script>

<template>
  <section aria-labelledby="titulo-libre">
    <p class="kicker">07 · Libre disposición</p>
    <h2 id="titulo-libre">El tercio de libre disposición</h2>
    <label class="interruptor"><input v-model="personalizada" type="checkbox"> Quiero elegir destinatarios</label>
    <p v-if="!personalizada" class="nota">Sin disposición: se reparte por estirpes.</p>
    <template v-else>
      <div class="catalogo">
        <label>Nombre<input v-model="nombre" data-testid="libre-nombre" placeholder="Persona o entidad"></label>
        <label>Tipo<select v-model="tipo"><option value="persona">Persona</option><option value="entidad">Entidad</option></select></label>
        <label v-if="tipo === 'persona'">Parentesco<select v-model="parentesco" data-testid="libre-parentesco"><option value="descendiente">Nieto o hijo</option><option value="cercano">Sobrino o familiar cercano</option><option value="ajeno">Otra persona</option></select></label>
        <button type="button" class="secundario" data-testid="anadir-beneficiario" @click="anadir">Añadir al catálogo</button>
      </div>
      <div class="porcentajes">
        <label v-for="(reparto, indice) in store.input.disposiciones.libre" :key="reparto.herederoId">
          <span class="reparto-cabecera">
            <strong>{{ store.beneficiarios.find(p => p.id === reparto.herederoId)?.nombre }}</strong>
            <select
              v-if="ficha(reparto.herederoId)?.tipo === 'persona'"
              :value="ficha(reparto.herederoId)?.parentesco ?? 'ajeno'"
              :data-testid="`parentesco-${indice}`"
              @change="marcar(reparto.herederoId, ($event.target as HTMLSelectElement).value)"
            >
              <option value="descendiente">Nieto o hijo</option>
              <option value="cercano">Sobrino o familiar cercano</option>
              <option value="ajeno">Otra persona</option>
            </select>
            <b>{{ porcentaje(reparto.bps) }} %</b>
          </span>
          <input
            :value="porcentaje(reparto.bps)"
            type="range"
            min="0"
            max="100"
            step="1"
            :aria-valuetext="`${porcentaje(reparto.bps)} por ciento`"
            :data-testid="`libre-${indice}`"
            @input="fijarPorcentaje(reparto, ($event.target as HTMLInputElement).value)"
          >
        </label>
        <p :class="{ alerta: suma !== 10000 }" aria-live="polite">Total: {{ porcentaje(suma) }} %</p>
      </div>
    </template>
  </section>
</template>
