<script setup lang="ts">
import { computed } from 'vue'
import { centimosAEuros } from '../../composables/useSuccession'
import { TEXTOS_LEGALES } from '../../content/legal'
import { COMUNIDADES_ISD, estimarIsd } from '../../domain/succession'
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
const estimacion = computed(() => estimarIsd(store.input, store.resultado))
</script>

<template>
  <section aria-labelledby="titulo-impuesto">
    <p class="kicker">09 · Impuesto de sucesiones</p>
    <h2 id="titulo-impuesto">¿Cuánto puede costar el impuesto?</h2>
    <p class="lede">Depende de la comunidad donde el causante tuvo su residencia habitual, no de la vecindad civil.</p>
    <label class="campo-suelto">
      Comunidad
      <select v-model="store.input.comunidadIsd" data-testid="comunidad-isd">
        <option :value="null" disabled>Elige una comunidad</option>
        <option v-for="comunidad in COMUNIDADES_ISD" :key="comunidad.id" :value="comunidad.id">{{ comunidad.nombre }}</option>
      </select>
    </label>

    <template v-if="estimacion">
      <div v-if="estimacion.totalCent !== null" class="magnitudes" data-testid="cuota-isd">
        <div><span>Coste estimado</span><strong>{{ centimosAEuros(estimacion.totalCent) }}</strong></div>
      </div>
      <p v-else class="aviso">En esta comunidad el despacho tiene que calcular la cuota.</p>
      <ul v-if="estimacion.porHeredero.length" class="lista-limpia">
        <li v-for="persona in estimacion.porHeredero" :key="persona.herederoId">
          <span>{{ persona.nombre }} · grupo {{ persona.grupo }}</span>
          <strong>{{ persona.cuotaCent === null ? 'A calcular' : centimosAEuros(persona.cuotaCent) }}</strong>
        </li>
      </ul>
      <p v-for="nota in estimacion.notas" :key="nota" class="nota">{{ nota }}</p>
    </template>
    <p class="nota">{{ TEXTOS_LEGALES.avisoIsd }}</p>
  </section>
</template>
