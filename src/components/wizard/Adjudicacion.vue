<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { centimosAEuros } from '../../composables/useSuccession'
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
const arrastrado = ref<string | null>(null)

function asignar(inmuebleId: string, herederoId: string) {
  if (!herederoId) return
  const existe = store.input.adjudicaciones.some(a => a.inmuebleId === inmuebleId && a.herederoId === herederoId)
  if (!existe) store.input.adjudicaciones.push({ inmuebleId, herederoId, bps: 10000 })
}
function soltar(herederoId: string) {
  if (arrastrado.value) asignar(arrastrado.value, herederoId)
  arrastrado.value = null
}
function asignaciones(inmuebleId: string) {
  return store.input.adjudicaciones.filter(a => a.inmuebleId === inmuebleId)
}
function nombre(id: string) {
  return store.beneficiarios.find(p => p.id === id)?.nombre ?? id
}
function porcentaje(bps: number) {
  return Math.round(bps / 100)
}
function fijarPorcentaje(item: { bps: number }, valor: string) {
  const porcentajeElegido = Math.min(100, Math.max(0, Math.round(Number(valor) || 0)))
  item.bps = porcentajeElegido * 100
}

const usufructo = computed(() => store.input.usufructoInmueble)
const candidatosNuda = computed(() =>
  store.beneficiarios.filter(persona => persona.id !== usufructo.value.usufructuarioId),
)

watch(() => usufructo.value.activo, (activo) => {
  if (!activo) {
    store.input.usufructoInmueble.inmuebleId = null
    store.input.usufructoInmueble.usufructuarioId = null
    store.input.usufructoInmueble.nudaPropiedadIds = []
  }
})

watch(() => usufructo.value.usufructuarioId, (id) => {
  if (!id) return
  store.input.usufructoInmueble.nudaPropiedadIds = store.input.usufructoInmueble.nudaPropiedadIds
    .filter(candidato => candidato !== id)
})

function toggleNuda(id: string, marcado: boolean) {
  const lista = store.input.usufructoInmueble.nudaPropiedadIds
  if (marcado && !lista.includes(id)) lista.push(id)
  if (!marcado) store.input.usufructoInmueble.nudaPropiedadIds = lista.filter(item => item !== id)
}
</script>

<template>
  <section aria-labelledby="titulo-adjudicacion">
    <p class="kicker">08 · Adjudicación</p>
    <h2 id="titulo-adjudicacion">¿Quién recibe cada inmueble?</h2>
    <p class="lede">Arrastra una ficha o usa el selector accesible. Puedes dividir cada inmueble por porcentajes.</p>
    <div class="adjudicacion-grid">
      <div>
        <h3>Inmuebles</h3>
        <article v-for="bien in store.input.inmuebles" :key="bien.id" class="bien-arrastrable" draggable="true" @dragstart="arrastrado = bien.id">
          <strong>{{ bien.nombre }}</strong><span>{{ centimosAEuros(bien.valorCent) }}</span>
          <label>Asignar a
            <select :data-testid="`asignar-${bien.id}`" @change="asignar(bien.id, ($event.target as HTMLSelectElement).value)">
              <option value="">Selecciona…</option><option v-for="persona in store.beneficiarios" :key="persona.id" :value="persona.id">{{ persona.nombre }}</option>
            </select>
          </label>
          <div v-for="item in asignaciones(bien.id)" :key="item.herederoId" class="linea reparto-inmueble">
            <span>{{ nombre(item.herederoId) }}</span>
            <label class="porcentaje-inmueble">
              <span class="sr-only">Porcentaje para {{ nombre(item.herederoId) }}</span>
              <input
                :value="porcentaje(item.bps)"
                type="range"
                min="0"
                max="100"
                step="1"
                :aria-valuetext="`${porcentaje(item.bps)} por ciento`"
                @input="fijarPorcentaje(item, ($event.target as HTMLInputElement).value)"
              >
              <b>{{ porcentaje(item.bps) }} %</b>
            </label>
            <button class="texto" type="button" @click="store.input.adjudicaciones.splice(store.input.adjudicaciones.indexOf(item), 1)">Quitar</button>
          </div>
        </article>
      </div>
      <div>
        <h3>Beneficiarios</h3>
        <div v-for="persona in store.beneficiarios" :key="persona.id" class="zona-drop" tabindex="0" @dragover.prevent @drop.prevent="soltar(persona.id)">
          <strong>{{ persona.nombre }}</strong><span>Suelta aquí un inmueble</span>
        </div>
      </div>
    </div>

    <fieldset class="usufructo-inmueble" data-testid="usufructo-inmueble" v-if="store.input.inmuebles.length">
      <legend>Usufructo de un inmueble</legend>
      <p class="nota">
        Puedes dejar el uso y disfrute a una persona y la nuda propiedad a los herederos.
        Es orientativo: el borrador no valora el usufructo en euros.
      </p>
      <label class="check">
        <input v-model="store.input.usufructoInmueble.activo" type="checkbox" data-testid="usufructo-activo">
        Quiero dejar un inmueble en usufructo
      </label>
      <template v-if="store.input.usufructoInmueble.activo">
        <label class="campo-suelto">
          Inmueble
          <select v-model="store.input.usufructoInmueble.inmuebleId" data-testid="usufructo-inmueble-id">
            <option :value="null">Selecciona…</option>
            <option v-for="bien in store.input.inmuebles" :key="bien.id" :value="bien.id">{{ bien.nombre }}</option>
          </select>
        </label>
        <label class="campo-suelto">
          Usufructuario
          <select v-model="store.input.usufructoInmueble.usufructuarioId" data-testid="usufructo-persona">
            <option :value="null">Selecciona…</option>
            <option v-for="persona in store.beneficiarios" :key="persona.id" :value="persona.id">{{ persona.nombre }}</option>
          </select>
        </label>
        <fieldset class="nuda-propiedad">
          <legend>Nuda propiedad</legend>
          <p class="nota">Si no marcas a nadie, la nuda propiedad queda para los herederos según este testamento.</p>
          <label v-for="persona in candidatosNuda" :key="persona.id" class="check">
            <input
              type="checkbox"
              :checked="store.input.usufructoInmueble.nudaPropiedadIds.includes(persona.id)"
              @change="toggleNuda(persona.id, ($event.target as HTMLInputElement).checked)"
            >
            {{ persona.nombre }}
          </label>
        </fieldset>
      </template>
    </fieldset>
  </section>
</template>
