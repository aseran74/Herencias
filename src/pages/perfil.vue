<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { calcularSucesion } from '../domain/succession'
import { centimosAEuros } from '../composables/useSuccession'
import { borrarPendiente, leerPendiente } from '../composables/useGuardadoPendiente'
import { useSimulaciones, type SimulacionGuardada } from '../composables/useSimulaciones'
import { useAuthStore } from '../stores/auth'
import { useWizardStore } from '../stores/wizard'

const auth = useAuthStore()
const wizard = useWizardStore()
const simulaciones = ref<SimulacionGuardada[]>([])
const cargandoLista = ref(false)
const aviso = ref('')
const error = ref('')
const nombrePerfil = ref('')
const editandoId = ref('')
const tituloEditado = ref('')
const confirmarEliminar = ref('')

const iniciales = computed(() => auth.nombre.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase())

onMounted(async () => {
  await auth.hidratar()
  if (!auth.user) return
  nombrePerfil.value = auth.nombre
  await cargarLista()
  const pendiente = leerPendiente()
  if (pendiente) {
    try {
      await useSimulaciones().guardar(auth.user.id, pendiente.titulo, pendiente.input, pendiente.paso)
      borrarPendiente()
      aviso.value = 'La simulación se ha guardado en tu perfil.'
      await cargarLista()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'No se pudo completar el guardado pendiente'
    }
  }
})

async function cargarLista() {
  cargandoLista.value = true
  error.value = ''
  try {
    simulaciones.value = await useSimulaciones().listar()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar las simulaciones'
  } finally {
    cargandoLista.value = false
  }
}

function importe(simulacion: SimulacionGuardada): string {
  const caudal = calcularSucesion(simulacion.input).caudalCent
  return caudal === null ? 'Pendiente de cálculo' : centimosAEuros(caudal)
}

function fecha(valor: string): string {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(new Date(valor))
}

async function abrir(simulacion: SimulacionGuardada) {
  wizard.cargar(simulacion.input, simulacion.paso)
  await navigateTo('/')
}

function editar(simulacion: SimulacionGuardada) {
  editandoId.value = simulacion.id
  tituloEditado.value = simulacion.titulo
}

async function renombrar(simulacion: SimulacionGuardada) {
  if (tituloEditado.value.trim().length < 2) return
  try {
    await useSimulaciones().renombrar(simulacion.id, tituloEditado.value)
    simulacion.titulo = tituloEditado.value.trim()
    editandoId.value = ''
    aviso.value = 'Nombre actualizado.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo renombrar'
  }
}

async function eliminar(id: string) {
  if (confirmarEliminar.value !== id) {
    confirmarEliminar.value = id
    return
  }
  try {
    await useSimulaciones().eliminar(id)
    simulaciones.value = simulaciones.value.filter(s => s.id !== id)
    confirmarEliminar.value = ''
    aviso.value = 'Simulación eliminada.'
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo eliminar'
  }
}

async function guardarPerfil() {
  if (await auth.actualizarNombre(nombrePerfil.value)) aviso.value = 'Perfil actualizado.'
}
</script>

<template>
  <div class="pagina-perfil">
    <main class="perfil-contenido">
      <template v-if="auth.cargando">
        <p class="estado-cuenta" role="status">Recuperando tu perfil…</p>
      </template>
      <section v-else-if="!auth.user" class="tarjeta-cuenta perfil-vacio">
        <p class="kicker">Tu espacio privado</p>
        <h1>Accede a tu perfil</h1>
        <p>Inicia sesión para consultar las posibles herencias que hayas guardado.</p>
        <NuxtLink class="boton-enlace" to="/acceso">Acceder o crear cuenta</NuxtLink>
      </section>
      <template v-else>
        <header class="cabecera-perfil">
          <div v-if="auth.avatar" class="avatar"><img :src="auth.avatar" alt=""></div>
          <div v-else class="avatar avatar-texto" aria-hidden="true">{{ iniciales }}</div>
          <div>
            <p class="kicker">Mi perfil</p>
            <h1>{{ auth.nombre }}</h1>
            <p>{{ auth.user.email }}</p>
          </div>
          <button type="button" class="secundario" @click="auth.cerrarSesion">Cerrar sesión</button>
        </header>

        <p v-if="aviso" class="exito" role="status">{{ aviso }}</p>
        <p v-if="error || auth.error" class="alerta" role="alert">{{ error || auth.error }}</p>

        <section class="panel-perfil">
          <div>
            <p class="kicker">Datos de la cuenta</p>
            <h2>Cómo quieres que te llamemos</h2>
          </div>
          <form class="perfil-nombre" @submit.prevent="guardarPerfil">
            <label>Nombre visible<input v-model="nombrePerfil" required minlength="2" autocomplete="name"></label>
            <button type="submit">Guardar nombre</button>
          </form>
        </section>

        <section class="simulaciones-seccion">
          <header class="seccion-cabecera">
            <div>
              <p class="kicker">Tus casos</p>
              <h2>Posibles herencias</h2>
              <p>Son escenarios privados. Puedes abrirlos y modificarlos sin alterar las demás copias.</p>
            </div>
            <NuxtLink class="boton-enlace" to="/">Nueva simulación</NuxtLink>
          </header>

          <p v-if="cargandoLista" class="estado-cuenta" role="status">Cargando simulaciones…</p>
          <div v-else-if="simulaciones.length" class="lista-simulaciones">
            <article v-for="simulacion in simulaciones" :key="simulacion.id" class="tarjeta-simulacion">
              <div class="simulacion-meta">
                <span>Actualizada {{ fecha(simulacion.updatedAt) }}</span>
                <strong>{{ importe(simulacion) }}</strong>
              </div>
              <form v-if="editandoId === simulacion.id" class="renombrar" @submit.prevent="renombrar(simulacion)">
                <label class="sr-only" :for="`titulo-${simulacion.id}`">Nombre de la simulación</label>
                <input :id="`titulo-${simulacion.id}`" v-model="tituloEditado" required minlength="2" maxlength="100">
                <button type="submit">Guardar</button>
                <button type="button" class="secundario" @click="editandoId = ''">Cancelar</button>
              </form>
              <h3 v-else>{{ simulacion.titulo }}</h3>
              <div class="acciones-simulacion">
                <button type="button" @click="abrir(simulacion)">Abrir</button>
                <button type="button" class="secundario" @click="editar(simulacion)">Renombrar</button>
                <button type="button" class="texto peligro" @click="eliminar(simulacion.id)">
                  {{ confirmarEliminar === simulacion.id ? 'Confirmar eliminación' : 'Eliminar' }}
                </button>
              </div>
            </article>
          </div>
          <div v-else class="sin-simulaciones">
            <h3>Aún no tienes simulaciones guardadas</h3>
            <p>Completa un escenario y guárdalo desde el resumen.</p>
            <NuxtLink to="/">Empezar una simulación</NuxtLink>
          </div>
        </section>
      </template>
    </main>
  </div>
</template>
