<script setup lang="ts">
import { useWizardStore } from '../../stores/wizard'

defineProps<{ compacto?: boolean }>()
const store = useWizardStore()

function rellenar(evento: Event) {
  const valor = (evento.target as HTMLSelectElement).value
  if (valor) store.input.nombreAlbacea = valor
}
</script>

<template>
  <section aria-labelledby="titulo-albacea" data-testid="albacea">
    <template v-if="!compacto">
      <p class="kicker">10 · Albacea</p>
      <h2 id="titulo-albacea">¿Nombras albacea?</h2>
      <p class="lede">Puedes designar a un descendiente o a otra persona para que cumpla el testamento.</p>
    </template>
    <h3 v-else id="titulo-albacea">Nombrar albacea</h3>

    <fieldset class="opciones">
      <legend class="sr-only">Decisión sobre el albacea</legend>
      <label class="opcion">
        <input v-model="store.input.quiereAlbacea" data-testid="albacea-no" type="radio" name="albacea" :value="false">
        <span>No nombrar albacea</span>
      </label>
      <label class="opcion">
        <input v-model="store.input.quiereAlbacea" data-testid="albacea-si" type="radio" name="albacea" :value="true">
        <span>Sí, nombrar albacea</span>
      </label>
    </fieldset>

    <div v-if="store.input.quiereAlbacea" class="rejilla">
      <label v-if="store.descendientes.length">
        Usar un descendiente
        <select data-testid="albacea-lista" @change="rellenar">
          <option value="">Elegir</option>
          <option v-for="persona in store.descendientes" :key="persona.id" :value="persona.nombre">{{ persona.nombre }}</option>
        </select>
      </label>
      <label class="campo-suelto">
        Nombre del albacea
        <input v-model="store.input.nombreAlbacea" data-testid="albacea-nombre" autocomplete="name">
      </label>
    </div>
  </section>
</template>
