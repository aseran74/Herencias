<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Profesional, TipoProfesional } from '../../domain/profesionales'
import { fetchAdmin } from '../../composables/useAdminApi'
import { useAuthStore } from '../../stores/auth'

definePageMeta({ middleware: 'admin' })

const auth = useAuthStore()
const lista = ref<Profesional[]>([])
const cargando = ref(true)
const error = ref('')
const filtroTipo = ref<'todos' | TipoProfesional>('todos')
const filtroProvincia = ref('')
const editando = ref<Profesional | null>(null)
const formulario = ref({
  nombre: '',
  tipo: 'abogado' as TipoProfesional,
  localidad: '',
  provincia: '',
  telefono: '',
  email: '',
  activo: true,
})

const provincias = computed(() =>
  [...new Set(lista.value.map(item => item.provincia))].sort((a, b) => a.localeCompare(b, 'es')),
)

const filtrados = computed(() => lista.value.filter((item) => {
  if (filtroTipo.value !== 'todos' && item.tipo !== filtroTipo.value) return false
  if (filtroProvincia.value && item.provincia !== filtroProvincia.value) return false
  return true
}))

onMounted(async () => {
  await cargar()
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    lista.value = await fetchAdmin<Profesional[]>('/api/admin/profesionales?todos=1')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo cargar el directorio'
  } finally {
    cargando.value = false
  }
}

function nuevo() {
  editando.value = null
  formulario.value = {
    nombre: '',
    tipo: 'abogado',
    localidad: '',
    provincia: '',
    telefono: '',
    email: '',
    activo: true,
  }
}

function editar(item: Profesional) {
  editando.value = item
  formulario.value = {
    nombre: item.nombre,
    tipo: item.tipo,
    localidad: item.localidad,
    provincia: item.provincia,
    telefono: item.telefono,
    email: item.email,
    activo: item.activo,
  }
}

async function guardar() {
  error.value = ''
  try {
    if (editando.value) {
      await fetchAdmin(`/api/admin/profesionales/${editando.value.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formulario.value),
      })
    } else {
      await fetchAdmin('/api/admin/profesionales', {
        method: 'POST',
        body: JSON.stringify(formulario.value),
      })
    }
    nuevo()
    await cargar()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo guardar'
  }
}

async function desactivar(item: Profesional) {
  error.value = ''
  try {
    await fetchAdmin(`/api/admin/profesionales/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: !item.activo }),
    })
    await cargar()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'No se pudo actualizar'
  }
}
</script>

<template>
  <div class="pagina-admin">
    <header class="cabecera-admin">
      <div>
        <p class="kicker">Superadmin</p>
        <h1>Directorio de abogados y notarías</h1>
        <p class="lede">Gestiona el listado demo que ve el usuario en el resumen.</p>
      </div>
      <div class="acciones-admin">
        <span class="nota">{{ auth.user?.email }}</span>
        <NuxtLink to="/">Ir al simulador</NuxtLink>
      </div>
    </header>

    <p v-if="error" class="alerta" role="alert">{{ error }}</p>
    <p v-if="cargando" class="nota">Cargando…</p>

    <section class="panel-admin" aria-labelledby="titulo-form-admin">
      <h2 id="titulo-form-admin">{{ editando ? 'Editar' : 'Añadir' }} profesional</h2>
      <form class="form-admin" @submit.prevent="guardar">
        <label>Nombre<input v-model="formulario.nombre" required minlength="2" maxlength="160"></label>
        <label>Tipo
          <select v-model="formulario.tipo">
            <option value="abogado">Abogado</option>
            <option value="notaria">Notaría</option>
          </select>
        </label>
        <label>Localidad<input v-model="formulario.localidad" required minlength="2" maxlength="120"></label>
        <label>Provincia<input v-model="formulario.provincia" required minlength="2" maxlength="120"></label>
        <label>Teléfono<input v-model="formulario.telefono" maxlength="32"></label>
        <label>Email<input v-model="formulario.email" type="email" maxlength="200"></label>
        <label class="check"><input v-model="formulario.activo" type="checkbox"> Activo</label>
        <div class="acciones-admin">
          <button type="submit">{{ editando ? 'Guardar cambios' : 'Crear' }}</button>
          <button v-if="editando" type="button" class="secundario" @click="nuevo">Cancelar</button>
        </div>
      </form>
    </section>

    <section class="panel-admin" aria-labelledby="titulo-lista-admin">
      <div class="filtros-admin">
        <h2 id="titulo-lista-admin">Listado ({{ filtrados.length }})</h2>
        <label>Tipo
          <select v-model="filtroTipo">
            <option value="todos">Todos</option>
            <option value="abogado">Abogados</option>
            <option value="notaria">Notarías</option>
          </select>
        </label>
        <label>Provincia
          <select v-model="filtroProvincia">
            <option value="">Todas</option>
            <option v-for="provincia in provincias" :key="provincia" :value="provincia">{{ provincia }}</option>
          </select>
        </label>
      </div>
      <ul class="lista-admin">
        <li v-for="item in filtrados" :key="item.id">
          <div>
            <strong>{{ item.nombre }}</strong>
            <p class="nota">{{ item.tipo === 'abogado' ? 'Abogado' : 'Notaría' }} · {{ item.localidad }} ({{ item.provincia }})</p>
            <p class="nota">{{ item.telefono }} {{ item.email }}</p>
            <p v-if="!item.activo" class="alerta">Inactivo</p>
          </div>
          <div class="acciones-admin">
            <button type="button" class="secundario" @click="editar(item)">Editar</button>
            <button type="button" class="texto" @click="desactivar(item)">{{ item.activo ? 'Desactivar' : 'Activar' }}</button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
