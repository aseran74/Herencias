<script setup lang="ts">
import { computed, watch } from 'vue'
import { centimosAEuros } from '../../composables/useSuccession'
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
const legitimarios = computed(() => store.resultado.porHeredero.filter(persona => persona.estrictaCent > 0))
const inmuebleElegido = computed(() =>
  store.input.inmuebles.find(inmueble => inmueble.id === store.input.atribucionEstricta.inmuebleId) ?? null,
)

watch(
  () => store.input.atribucionEstricta.tipo,
  (tipo) => {
    if (!tipo) {
      store.input.atribucionEstricta.inmuebleId = null
      return
    }
    if (!store.input.atribucionEstricta.inmuebleId && store.input.inmuebles[0]) {
      store.input.atribucionEstricta.inmuebleId = store.input.inmuebles[0].id
    }
  },
)
</script>

<template>
  <section aria-labelledby="titulo-estricta">
    <p class="kicker">05 · Legítima estricta</p>
    <template v-if="store.sinDescendientes">
      <h2 id="titulo-estricta">No hay tercio de estricta</h2>
      <p class="lede" data-testid="estricta-no-aplica">
        Al no haber hijos ni estirpes, no se reserva un tercio de estricta. Todo el caudal es de libre disposición entre las personas que hayas nombrado. Si viven los padres o abuelos, el notario revisará su legítima.
      </p>
    </template>
    <template v-else>
    <h2 id="titulo-estricta">El tercio reservado</h2>
    <p class="lede">Se reparte automáticamente por igual entre las estirpes. Aquí puedes, además, dejarles un inmueble concreto o su alquiler.</p>
    <div class="cifra-destacada">
      <span>Legítima estricta</span>
      <strong>{{ store.resultado.tercios ? centimosAEuros(store.resultado.tercios.estrictaCent) : '—' }}</strong>
    </div>
    <ul class="lista-limpia">
      <li v-for="persona in legitimarios" :key="persona.herederoId">
        <span>{{ persona.nombre }}</span><strong>{{ centimosAEuros(persona.estrictaCent) }}</strong>
      </li>
    </ul>

    <fieldset class="opciones atribucion-estricta">
      <legend>¿Dejas un bien concreto a los legitimarios?</legend>
      <p class="nota">No cambia el importe del tercio. Solo indica cómo quieres satisfacerlo: con un inmueble o con las rentas de alquiler.</p>
      <label class="opcion">
        <input v-model="store.input.atribucionEstricta.tipo" data-testid="estricta-sin-bien" type="radio" name="atribucion-estricta" :value="null">
        <span>No: solo el tercio en dinero o en la partición</span>
      </label>
      <label class="opcion">
        <input v-model="store.input.atribucionEstricta.tipo" data-testid="estricta-inmueble" type="radio" name="atribucion-estricta" value="inmueble">
        <span>Sí: un inmueble concreto</span>
      </label>
      <label class="opcion">
        <input v-model="store.input.atribucionEstricta.tipo" data-testid="estricta-alquiler" type="radio" name="atribucion-estricta" value="alquiler">
        <span>Sí: el alquiler de un inmueble</span>
      </label>
    </fieldset>

    <label v-if="store.input.atribucionEstricta.tipo" class="campo-suelto">
      {{ store.input.atribucionEstricta.tipo === 'alquiler' ? 'Inmueble cuyas rentas dejas' : 'Inmueble que dejas' }}
      <select v-if="store.input.inmuebles.length" v-model="store.input.atribucionEstricta.inmuebleId" data-testid="estricta-inmueble-id">
        <option :value="null" disabled>Elige un inmueble</option>
        <option v-for="bien in store.input.inmuebles" :key="bien.id" :value="bien.id">{{ bien.nombre || 'Inmueble sin nombre' }}</option>
      </select>
      <p v-else class="nota">Añade un inmueble en Patrimonio para poder atribuirlo aquí.</p>
    </label>
    <p v-if="inmuebleElegido && store.input.atribucionEstricta.tipo === 'inmueble'" class="nota">
      {{ inmuebleElegido.nombre }} se atribuiría en pago de la estricta, por igual entre {{ legitimarios.map(p => p.nombre).join(', ') || 'las estirpes' }}. Si su valor no coincide con este tercio, la diferencia se compensará en la partición.
    </p>
    <p v-if="inmuebleElegido && store.input.atribucionEstricta.tipo === 'alquiler'" class="nota">
      Las rentas de {{ inmuebleElegido.nombre }} corresponderían a {{ legitimarios.map(p => p.nombre).join(', ') || 'las estirpes' }}, por igual. El inmueble en sí sigue en el caudal, salvo que más adelante lo adjudiques.
    </p>
    </template>
  </section>
</template>
