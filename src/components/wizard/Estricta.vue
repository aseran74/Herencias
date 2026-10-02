<script setup lang="ts">
import { centimosAEuros } from '../../composables/useSuccession'
import { useWizardStore } from '../../stores/wizard'
const store = useWizardStore()
</script>

<template>
  <section aria-labelledby="titulo-estricta">
    <p class="kicker">05 · Legítima estricta</p>
    <h2 id="titulo-estricta">El tercio reservado</h2>
    <p class="lede">Se reparte automáticamente por igual entre estirpes.</p>
    <div class="cifra-destacada">
      <span>Legítima estricta</span>
      <strong>{{ store.resultado.tercios ? centimosAEuros(store.resultado.tercios.estrictaCent) : '—' }}</strong>
    </div>
    <ul class="lista-limpia">
      <li v-for="persona in store.resultado.porHeredero.filter(p => p.estrictaCent)" :key="persona.herederoId">
        <span>{{ persona.nombre }}</span><strong>{{ centimosAEuros(persona.estrictaCent) }}</strong>
      </li>
    </ul>
  </section>
</template>
