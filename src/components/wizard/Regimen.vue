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
  if (situacion !== 'conyuge_vivo') {
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
    <fieldset v-if="store.input.situacionConyugal === 'conyuge_vivo'" class="opciones">
      <legend>Régimen económico del matrimonio</legend>
      <label class="opcion"><input v-model="store.input.regimenEconomico" type="radio" value="gananciales"> Gananciales</label>
      <label class="opcion"><input v-model="store.input.regimenEconomico" type="radio" value="separacion_bienes"> Separación de bienes</label>
    </fieldset>
    <aside
      v-if="store.input.situacionConyugal === 'conyuge_vivo' && store.input.regimenEconomico !== 'soltero_viudo'"
      class="explicacion-conyuge"
      aria-labelledby="como-se-protege-conyuge"
    >
      <p class="kicker">Antes de repartir</p>
      <h3 id="como-se-protege-conyuge">¿Qué recibe el cónyuge?</h3>
      <ol>
        <li v-if="store.input.regimenEconomico === 'gananciales'">
          <strong>Primero se separan los gananciales.</strong>
          La mitad neta de cada bien ganancial ya pertenece al cónyuge. No se hereda ni se reparte entre los hijos.
        </li>
        <li>
          <strong>Después se calcula la herencia.</strong>
          Entran la mitad del causante de los bienes gananciales y el 100 % de sus bienes privativos.
        </li>
        <li>
          <strong>Además existe el usufructo viudal.</strong>
          El cónyuge no separado tiene derecho al usufructo del tercio de mejora. Los descendientes conservan la propiedad, pero esa parte queda sujeta al usufructo.
        </li>
      </ol>
      <p v-if="store.input.regimenEconomico === 'separacion_bienes'" class="nota">
        En separación de bienes no se aparta automáticamente un 50 %. Solo entra en la herencia lo que pertenecía al causante, pero se mantiene el usufructo legal del tercio de mejora.
      </p>
    </aside>
    <p v-if="store.input.regimen !== 'comun'" class="aviso" data-testid="aviso-foral">
      Este simulador no calcula derechos forales. Puedes continuar para solicitar revisión personalizada.
    </p>
  </section>
</template>
