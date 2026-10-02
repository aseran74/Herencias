<script setup lang="ts">
import { eurosACentimos } from '../../composables/useSuccession'
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
const textos = new Map<string, { valor: string; cargas: string }>()

function nuevoInmueble() {
  const id = `inmueble-${crypto.randomUUID()}`
  store.input.inmuebles.push({ id, nombre: '', valorCent: 0, porcentajeCausanteBps: 10000, cargasCent: 0 })
  textos.set(id, { valor: '', cargas: '' })
}
function nuevoActivo() {
  store.input.otrosActivos.push({ id: `activo-${crypto.randomUUID()}`, tipo: 'cuenta', valorCent: 0, porcentajeCausanteBps: 10000 })
}
function dinero(valor: string, aplicar: (cent: number) => void) {
  const cent = eurosACentimos(valor)
  aplicar(cent ?? 0)
}
function texto(id: string) {
  if (!textos.has(id)) textos.set(id, { valor: '', cargas: '' })
  return textos.get(id)!
}
</script>

<template>
  <section aria-labelledby="titulo-patrimonio">
    <p class="kicker">02 · Inventario</p>
    <h2 id="titulo-patrimonio">Patrimonio que entra en la herencia</h2>
    <p class="lede">Escribe euros; la aplicación los convierte internamente a céntimos exactos.</p>

    <div v-for="(bien, indice) in store.input.inmuebles" :key="bien.id" class="tarjeta">
      <div class="tarjeta-cabecera"><h3>Inmueble {{ indice + 1 }}</h3><button class="texto" type="button" @click="store.input.inmuebles.splice(indice, 1)">Eliminar</button></div>
      <div class="rejilla">
        <label>Descripción<input v-model="bien.nombre" :data-testid="`inmueble-nombre-${indice}`" placeholder="Vivienda habitual"></label>
        <label>Valor (€)<input v-model="texto(bien.id).valor" inputmode="decimal" :data-testid="`inmueble-valor-${indice}`" @input="dinero(($event.target as HTMLInputElement).value, v => bien.valorCent = v)"></label>
        <label>Participación del causante (%)<input :value="bien.porcentajeCausanteBps / 100" type="number" min="0" max="100" step="0.01" @input="bien.porcentajeCausanteBps = Math.round(Number(($event.target as HTMLInputElement).value) * 100)"></label>
        <label>Cargas (€)<input v-model="texto(bien.id).cargas" inputmode="decimal" @input="dinero(($event.target as HTMLInputElement).value, v => bien.cargasCent = v)"></label>
      </div>
    </div>
    <button type="button" class="secundario" data-testid="anadir-inmueble" @click="nuevoInmueble">+ Añadir inmueble</button>

    <h3>Otros activos</h3>
    <div v-for="(activo, indice) in store.input.otrosActivos" :key="activo.id" class="fila-activo">
      <select v-model="activo.tipo" :aria-label="`Tipo de activo ${indice + 1}`"><option value="cuenta">Cuenta</option><option value="deposito">Depósito</option><option value="fondo">Fondo</option><option value="otro">Otro</option></select>
      <label>Valor (€)<input inputmode="decimal" :data-testid="`activo-valor-${indice}`" @input="dinero(($event.target as HTMLInputElement).value, v => activo.valorCent = v)"></label>
      <button class="texto" type="button" @click="store.input.otrosActivos.splice(indice, 1)">Eliminar</button>
    </div>
    <button type="button" class="secundario" data-testid="anadir-activo" @click="nuevoActivo">+ Añadir otro activo</button>

    <label class="campo-suelto">Deudas y cargas generales (€)
      <input inputmode="decimal" data-testid="deudas" @input="dinero(($event.target as HTMLInputElement).value, v => store.input.deudasCent = v)">
    </label>
  </section>
</template>
