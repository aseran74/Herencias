<script setup lang="ts">
import { computed } from 'vue'
import { hayCondicionesEspeciales } from '../../domain/succession'
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

const opcionesCondicion = [
  ['fiducia', 'Fiducia'],
  ['sustitucion', 'Sustitución vulgar o fideicomisaria'],
  ['legadoCondicionado', 'Legado condicionado'],
  ['inalienabilidad', 'Inalienabilidad'],
  ['otra', 'Otra condición'],
] as const

const hayCondiciones = computed(() => hayCondicionesEspeciales(store.input.condicionesEspeciales))
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

    <fieldset class="condiciones-especiales" data-testid="condiciones-especiales">
      <legend>Condiciones especiales para el despacho</legend>
      <p class="nota">Marca lo que quieras que el abogado redacte. Cualquier marca o texto obliga a revisión profesional.</p>
      <label v-for="[clave, etiqueta] in opcionesCondicion" :key="clave" class="check">
        <input v-model="store.input.condicionesEspeciales[clave]" type="checkbox">
        {{ etiqueta }}
      </label>
      <label class="campo-suelto">
        Explica la condición o lo que debe preparar el despacho
        <textarea
          v-model="store.input.condicionesEspeciales.texto"
          data-testid="condiciones-texto"
          rows="4"
          maxlength="2000"
          placeholder="Por ejemplo: el piso de Madrid en usufructo vitalicio a mi hija, con prohibición de vender hasta que cumpla 30…"
        />
      </label>
    </fieldset>

    <p v-if="store.bloqueado || hayCondiciones" class="aviso" data-testid="caso-bloqueante">
      Este caso requiere revisión profesional{{ hayCondiciones ? ' por las condiciones especiales' : '' }} y se mostrará sin reparto.
    </p>
  </section>
</template>
