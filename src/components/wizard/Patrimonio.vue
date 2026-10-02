<script setup lang="ts">
import { eurosACentimos } from '../../composables/useSuccession'
import type { Inmueble, OtroActivo } from '../../domain/succession'
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
const textos = new Map<string, { valor: string; cargas: string }>()

function nuevoInmueble() {
  const id = `inmueble-${crypto.randomUUID()}`
  const ganancial = store.input.regimenEconomico === 'gananciales'
  store.input.inmuebles.push({
    id,
    nombre: '',
    naturaleza: ganancial ? 'ganancial' : 'privativo',
    valorCent: 0,
    porcentajeCausanteBps: ganancial ? 5_000 : 10_000,
    cargasCent: 0,
  })
  textos.set(id, { valor: '', cargas: '' })
}
function nuevoActivo() {
  const ganancial = store.input.regimenEconomico === 'gananciales'
  store.input.otrosActivos.push({
    id: `activo-${crypto.randomUUID()}`,
    tipo: 'cuenta',
    naturaleza: ganancial ? 'ganancial' : 'privativo',
    valorCent: 0,
    porcentajeCausanteBps: ganancial ? 5_000 : 10_000,
  })
}
function dinero(valor: string, aplicar: (cent: number) => void) {
  const cent = eurosACentimos(valor)
  aplicar(cent ?? 0)
}
function texto(id: string) {
  if (!textos.has(id)) textos.set(id, { valor: '', cargas: '' })
  return textos.get(id)!
}
function cambiarNaturaleza(activo: Inmueble | OtroActivo) {
  if (activo.naturaleza === 'ganancial') activo.porcentajeCausanteBps = 5_000
  if (activo.naturaleza === 'privativo') activo.porcentajeCausanteBps = 10_000
}
</script>

<template>
  <section aria-labelledby="titulo-patrimonio">
    <p class="kicker">02 · Inventario</p>
    <h2 id="titulo-patrimonio">Patrimonio que entra en la herencia</h2>
    <p class="lede">Escribe euros; la aplicación los convierte internamente a céntimos exactos.</p>
    <aside v-if="store.input.regimenEconomico === 'gananciales'" class="explicacion-conyuge">
      <p class="kicker">Gananciales, bien por bien</p>
      <h3>Indica qué bienes son realmente gananciales</h3>
      <p>
        No todo lo que tiene una persona casada es necesariamente ganancial. Marca cada bien como
        <strong>ganancial</strong>, <strong>privativo del causante</strong> u <strong>otra titularidad</strong>.
      </p>
      <p class="ejemplo-claro">
        Ejemplo: vivienda ganancial de 300.000 € → 150.000 € para el cónyuge, fuera de la herencia,
        y 150.000 € para formar el caudal hereditario.
      </p>
    </aside>

    <div v-for="(bien, indice) in store.input.inmuebles" :key="bien.id" class="tarjeta">
      <div class="tarjeta-cabecera"><h3>Inmueble {{ indice + 1 }}</h3><button class="texto" type="button" @click="store.input.inmuebles.splice(indice, 1)">Eliminar</button></div>
      <div class="rejilla">
        <label>Descripción<input v-model="bien.nombre" :data-testid="`inmueble-nombre-${indice}`" placeholder="Vivienda habitual"></label>
        <label>Valor (€)<input v-model="texto(bien.id).valor" inputmode="decimal" :data-testid="`inmueble-valor-${indice}`" @input="dinero(($event.target as HTMLInputElement).value, v => bien.valorCent = v)"></label>
        <label v-if="store.input.regimenEconomico === 'gananciales'">
          Naturaleza del inmueble
          <select v-model="bien.naturaleza" @change="cambiarNaturaleza(bien)">
            <option value="ganancial">Ganancial: 50 % del cónyuge</option>
            <option value="privativo">Privativo del causante: 100 %</option>
            <option value="otra">Otra titularidad</option>
          </select>
        </label>
        <label v-if="store.input.regimenEconomico !== 'gananciales' || bien.naturaleza === 'otra'">
          Participación del causante (%)
          <input :value="bien.porcentajeCausanteBps / 100" type="number" min="0" max="100" step="0.01" @input="bien.porcentajeCausanteBps = Math.round(Number(($event.target as HTMLInputElement).value) * 100)">
        </label>
        <label>Cargas (€)<input v-model="texto(bien.id).cargas" inputmode="decimal" @input="dinero(($event.target as HTMLInputElement).value, v => bien.cargasCent = v)"></label>
      </div>
    </div>
    <button type="button" class="secundario" data-testid="anadir-inmueble" @click="nuevoInmueble">+ Añadir inmueble</button>

    <h3>Otros activos</h3>
    <div v-for="(activo, indice) in store.input.otrosActivos" :key="activo.id" class="fila-activo">
      <select v-model="activo.tipo" :aria-label="`Tipo de activo ${indice + 1}`"><option value="cuenta">Cuenta</option><option value="deposito">Depósito</option><option value="fondo">Fondo</option><option value="otro">Otro</option></select>
      <label>Valor (€)<input inputmode="decimal" :data-testid="`activo-valor-${indice}`" @input="dinero(($event.target as HTMLInputElement).value, v => activo.valorCent = v)"></label>
      <label v-if="store.input.regimenEconomico === 'gananciales'">
        Naturaleza
        <select v-model="activo.naturaleza" @change="cambiarNaturaleza(activo)">
          <option value="ganancial">Ganancial: 50 % del cónyuge</option>
          <option value="privativo">Privativo del causante: 100 %</option>
          <option value="otra">Otra titularidad</option>
        </select>
      </label>
      <label v-if="store.input.regimenEconomico !== 'gananciales' || activo.naturaleza === 'otra'">
        Participación del causante (%)
        <input :value="activo.porcentajeCausanteBps / 100" type="number" min="0" max="100" step="0.01" @input="activo.porcentajeCausanteBps = Math.round(Number(($event.target as HTMLInputElement).value) * 100)">
      </label>
      <button class="texto" type="button" @click="store.input.otrosActivos.splice(indice, 1)">Eliminar</button>
    </div>
    <button type="button" class="secundario" data-testid="anadir-activo" @click="nuevoActivo">+ Añadir otro activo</button>

    <label class="campo-suelto">Deudas y cargas generales (€)
      <input inputmode="decimal" data-testid="deudas" @input="dinero(($event.target as HTMLInputElement).value, v => store.input.deudasCent = v)">
    </label>
  </section>
</template>
