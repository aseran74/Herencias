<script setup lang="ts">
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
      <legend>Situación y régimen económico</legend>
      <label class="opcion"><input v-model="store.input.regimenEconomico" type="radio" value="gananciales"> Gananciales</label>
      <label class="opcion"><input v-model="store.input.regimenEconomico" type="radio" value="separacion_bienes"> Separación de bienes</label>
      <label class="opcion"><input v-model="store.input.regimenEconomico" type="radio" value="soltero_viudo"> Soltero/a o viudo/a</label>
    </fieldset>
    <p v-if="store.input.regimen !== 'comun'" class="aviso" data-testid="aviso-foral">
      Este simulador no calcula derechos forales. Puedes continuar para solicitar revisión personalizada.
    </p>
  </section>
</template>
