<script setup lang="ts">
import type { SituacionConyugal } from '../../domain/succession'
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
const regimenes = [
  ['comun', 'Derecho común'],
  ['cataluna', 'Cataluña'],
  ['navarra', 'Navarra'],
  ['pais_vasco', 'País Vasco'],
  ['galicia', 'Galicia'],
  ['aragon', 'Aragón'],
  ['baleares', 'Baleares'],
] as const

function elegirSituacion(situacion: SituacionConyugal) {
  store.input.situacionConyugal = situacion
  store.input.conyugeViudo = situacion === 'conyuge_vivo'
  if (situacion === 'soltero' || situacion === 'separado_divorciado') {
    store.input.regimenEconomico = 'soltero_viudo'
  }
}
</script>

<template>
  <section aria-labelledby="titulo-regimen">
    <p class="kicker">01 · Punto de partida</p>
    <h2 id="titulo-regimen">¿Qué ley civil se aplica?</h2>
    <p class="lede">Importa la vecindad civil del causante, no su residencia.</p>
    <fieldset class="opciones">
      <legend>Vecindad civil</legend>
      <label v-for="[valor, texto] in regimenes" :key="valor" class="opcion">
        <input v-model="store.input.regimen" type="radio" name="regimen" :value="valor">
        <span>{{ texto }}</span>
      </label>
    </fieldset>
    <fieldset class="opciones">
      <legend>Situación conyugal del causante</legend>
      <label class="opcion">
        <input
          :checked="store.input.situacionConyugal === 'conyuge_vivo'"
          type="radio"
          name="situacion-conyugal"
          value="conyuge_vivo"
          @change="elegirSituacion('conyuge_vivo')"
        >
        Casado/a: su cónyuge vive y no están separados
      </label>
      <label class="opcion">
        <input
          :checked="store.input.situacionConyugal === 'viudo'"
          type="radio"
          name="situacion-conyugal"
          value="viudo"
          @change="elegirSituacion('viudo')"
        >
        Viudo/a: su cónyuge ha fallecido
      </label>
      <label class="opcion">
        <input
          :checked="store.input.situacionConyugal === 'soltero'"
          type="radio"
          name="situacion-conyugal"
          value="soltero"
          @change="elegirSituacion('soltero')"
        >
        Soltero/a
      </label>
      <label class="opcion">
        <input
          :checked="store.input.situacionConyugal === 'separado_divorciado'"
          type="radio"
          name="situacion-conyugal"
          value="separado_divorciado"
          @change="elegirSituacion('separado_divorciado')"
        >
        Divorciado/a o separado/a
      </label>
    </fieldset>
    <fieldset v-if="store.input.situacionConyugal === 'conyuge_vivo' || store.input.situacionConyugal === 'viudo'" class="opciones">
      <legend>Régimen económico del matrimonio</legend>
      <label class="opcion"><input v-model="store.input.regimenEconomico" type="radio" value="gananciales"> Gananciales</label>
      <label class="opcion"><input v-model="store.input.regimenEconomico" type="radio" value="separacion_bienes"> Separación de bienes</label>
    </fieldset>
    <p v-if="store.input.regimen !== 'comun'" class="aviso" data-testid="aviso-foral">
      Este simulador no calcula derechos forales. Puedes continuar para solicitar revisión personalizada.
    </p>
  </section>
</template>
