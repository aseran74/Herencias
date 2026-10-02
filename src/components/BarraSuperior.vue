<script setup lang="ts">
import { PASOS, useWizardStore } from '../stores/wizard'
const store = useWizardStore()
</script>

<template>
  <header class="barra">
    <div class="pastilla">
      <NuxtLink class="marca" to="/">Herencias<span>Cuaderno sucesorio</span></NuxtLink>
      <nav class="pasos" aria-label="Nueve pasos del simulador" data-testid="pasos-barra">
        <button
          v-for="(nombre, indice) in PASOS"
          :key="nombre"
          type="button"
          class="paso"
          :class="{ activo: store.paso === indice + 1, completo: store.paso > indice + 1 }"
          :aria-current="store.paso === indice + 1 ? 'step' : undefined"
          :disabled="indice + 1 > store.paso"
          @click="store.irA(indice + 1)"
        >
          <span class="num">{{ indice + 1 }}</span>
          <span>{{ nombre }}</span>
        </button>
      </nav>
    </div>
  </header>
</template>
