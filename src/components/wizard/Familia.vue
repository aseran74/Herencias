<script setup lang="ts">
import { onMounted } from 'vue'
import type { RolColateral } from '../../domain/succession'
import { useWizardStore } from '../../stores/wizard'

const store = useWizardStore()
const etiquetas: Record<RolColateral, { titulo: string; boton: string; testid: string }> = {
  hermano: { titulo: 'Hermano/a', boton: '+ Añadir hermano/a', testid: 'anadir-hermano' },
  sobrino: { titulo: 'Sobrino/a', boton: '+ Añadir sobrino/a', testid: 'anadir-sobrino' },
  nieto: { titulo: 'Nieto/a', boton: '+ Añadir nieto/a', testid: 'anadir-nieto-libre' },
  familiar_cercano: { titulo: 'Familiar cercano', boton: '+ Añadir familiar', testid: 'anadir-familiar' },
  ong: { titulo: 'ONG', boton: '+ Añadir ONG', testid: 'anadir-ong' },
}

const sinHijos = () => store.input.situacionConyugal === 'soltero' && store.input.tieneHijos === false

function nuevoHijo() {
  store.input.hijos.push({ id: `hijo-${crypto.randomUUID()}`, nombre: '', vive: true, descendientes: [] })
}
function nuevoNieto(indice: number) {
  store.input.hijos[indice]!.descendientes.push({ id: `nieto-${crypto.randomUUID()}`, nombre: '' })
}
function colaterales(rol: RolColateral) {
  return store.input.beneficiariosLibre
    .map((persona, indice) => ({ persona, indice }))
    .filter(fila => fila.persona.rol === rol)
}
function nuevoColateral(rol: RolColateral) {
  store.input.beneficiariosLibre.push({
    id: `${rol}-${crypto.randomUUID()}`,
    nombre: '',
    tipo: rol === 'ong' ? 'entidad' : 'persona',
    parentesco: rol === 'nieto' ? 'descendiente' : rol === 'ong' ? 'ajeno' : 'cercano',
    rol,
  })
}
function quitarColateral(indice: number) {
  store.input.beneficiariosLibre.splice(indice, 1)
}

onMounted(() => {
  const roles: RolColateral[] = []
  if (store.input.destinosColaterales.hermanos) roles.push('hermano')
  if (store.input.destinosColaterales.sobrinos) roles.push('sobrino')
  if (store.input.destinosColaterales.nietos) roles.push('nieto')
  if (store.input.destinosColaterales.familiarCercano) roles.push('familiar_cercano')
  if (store.input.destinosColaterales.ong) roles.push('ong')
  for (const rol of roles) {
    if (!store.input.beneficiariosLibre.some(persona => persona.rol === rol)) nuevoColateral(rol)
  }
})

const mostrarHermanos = () => store.input.destinosColaterales.hermanos
const mostrarSobrinos = () => store.input.destinosColaterales.sobrinos
const mostrarNietos = () => store.input.destinosColaterales.nietos
const mostrarFamiliar = () => store.input.destinosColaterales.familiarCercano
const mostrarOng = () => store.input.destinosColaterales.ong
const hayDestinos = () => mostrarHermanos() || mostrarSobrinos() || mostrarNietos() || mostrarFamiliar() || mostrarOng()
const rolesActivos = () =>
  (['hermano', 'sobrino', 'nieto', 'familiar_cercano', 'ong'] as const).filter(rol =>
    (rol === 'hermano' && mostrarHermanos())
    || (rol === 'sobrino' && mostrarSobrinos())
    || (rol === 'nieto' && mostrarNietos())
    || (rol === 'familiar_cercano' && mostrarFamiliar())
    || (rol === 'ong' && mostrarOng()),
  )
</script>

<template>
  <section aria-labelledby="titulo-familia">
    <p class="kicker">03 · Familia</p>
    <template v-if="sinHijos()">
      <h2 id="titulo-familia">A quién dejas la herencia</h2>
      <p class="lede">
        Sin descendientes, el patrimonio se reparte entre las personas o entidades que indiques. Si no eliges porcentajes, se divide por igual.
      </p>
    </template>
    <template v-else>
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
    </template>

    <section v-if="hayDestinos()" class="colaterales" data-testid="colaterales">
      <h3 v-if="!sinHijos()">Otras personas o entidades a las que quieres dejar</h3>
      <template v-for="rol in rolesActivos()" :key="rol">
        <article v-for="(fila, orden) in colaterales(rol)" :key="fila.persona.id" class="tarjeta">
          <div class="tarjeta-cabecera">
            <h3>{{ etiquetas[rol].titulo }} {{ orden + 1 }}</h3>
            <button class="texto" type="button" @click="quitarColateral(fila.indice)">Eliminar</button>
          </div>
          <label>
            {{ rol === 'ong' ? 'Nombre de la entidad' : 'Nombre' }}
            <input v-model="fila.persona.nombre" :data-testid="`${rol}-nombre-${orden}`" autocomplete="off">
          </label>
        </article>
        <button type="button" class="secundario" :data-testid="etiquetas[rol].testid" @click="nuevoColateral(rol)">
          {{ etiquetas[rol].boton }}
        </button>
      </template>
    </section>
  </section>
</template>
