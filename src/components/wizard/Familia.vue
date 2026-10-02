<script setup lang="ts">
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
function nuevoHijo() {
  store.input.hijos.push({ id: `hijo-${crypto.randomUUID()}`, nombre: '', vive: true, descendientes: [] })
}
function nuevoNieto(indice: number) {
  store.input.hijos[indice]!.descendientes.push({ id: `nieto-${crypto.randomUUID()}`, nombre: '' })
}
</script>

<template>
  <section aria-labelledby="titulo-familia">
    <p class="kicker">03 · Familia</p>
    <h2 id="titulo-familia">Descendientes y ramas familiares</h2>
    <p class="lede">Si un hijo ha premuerto, sus hijos pueden ocupar su estirpe.</p>
    <article v-for="(hijo, indice) in store.input.hijos" :key="hijo.id" class="tarjeta">
      <div class="tarjeta-cabecera"><h3>Hijo/a {{ indice + 1 }}</h3><button class="texto" type="button" @click="store.input.hijos.splice(indice, 1)">Eliminar</button></div>
      <label>Nombre<input v-model="hijo.nombre" :data-testid="`hijo-nombre-${indice}`" autocomplete="off"></label>
      <label class="check"><input v-model="hijo.vive" type="checkbox"> Vive actualmente</label>
      <template v-if="!hijo.vive">
        <p class="nota">Añade sus descendientes para conservar esta estirpe.</p>
        <div v-for="(nieto, n) in hijo.descendientes" :key="nieto.id" class="linea">
          <label>Nieto/a {{ n + 1 }}<input v-model="nieto.nombre" :data-testid="`nieto-nombre-${indice}-${n}`"></label>
          <button class="texto" type="button" @click="hijo.descendientes.splice(n, 1)">Eliminar</button>
        </div>
        <button type="button" class="secundario" :data-testid="`anadir-nieto-${indice}`" @click="nuevoNieto(indice)">+ Añadir nieto/a</button>
      </template>
    </article>
    <button type="button" class="secundario" data-testid="anadir-hijo" @click="nuevoHijo">+ Añadir hijo/a</button>
  </section>
</template>
