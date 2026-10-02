<script setup lang="ts">
import { computed } from 'vue'
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
const preguntas = computed(() => {
  const todas = [
    ['testamentoAnterior', '¿Existe un testamento anterior?'],
    ['hijoConDiscapacidad', '¿Hay descendientes con discapacidad?'],
    ['desheredacion', '¿Se plantea una desheredación?'],
    ['empresaFamiliar', '¿Hay una empresa familiar?'],
    ['bienesExtranjero', '¿Hay bienes en el extranjero?'],
    ['pactoSucesorio', '¿Existe un pacto sucesorio?'],
  ] as const
  return store.sinDescendientes
    ? todas.filter(([clave]) => clave !== 'hijoConDiscapacidad')
    : todas
})
</script>

<template>
  <section aria-labelledby="titulo-cribado">
    <p class="kicker">04 · Cribado jurídico</p>
    <h2 id="titulo-cribado">¿Hay algo que exija revisión?</h2>
    <p class="lede">Una respuesta afirmativa detiene el reparto automático, pero no la solicitud de ayuda.</p>
    <fieldset class="cribado">
      <legend class="sr-only">Casos especiales</legend>
      <div v-for="[clave, pregunta] in preguntas" :key="clave" class="pregunta">
        <span>{{ pregunta }}</span>
        <label><input v-model="store.input.flags[clave]" type="radio" :name="clave" :value="true"> Sí</label>
        <label><input v-model="store.input.flags[clave]" type="radio" :name="clave" :value="false"> No</label>
      </div>
    </fieldset>
    <p v-if="store.bloqueado" class="aviso" data-testid="caso-bloqueante">Este caso requiere revisión profesional y se mostrará sin reparto.</p>
  </section>
</template>
