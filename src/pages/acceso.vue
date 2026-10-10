<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import logo from '../assets/logo-gestiona-tu-herencia.png'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const modo = ref<'acceso' | 'registro' | 'verificacion'>('acceso')
const nombre = ref('')
const email = ref('')
const password = ref('')
const codigo = ref('')
const mensaje = ref('')
const destino = computed(() => typeof route.query.siguiente === 'string' ? route.query.siguiente : '/perfil')

onMounted(async () => {
  await auth.hidratar()
  if (auth.autenticado) await navigateTo(destino.value)
})

async function enviar() {
  mensaje.value = ''
  if (modo.value === 'acceso') {
    if (await auth.acceder(email.value, password.value)) await navigateTo(destino.value)
    return
  }
  if (modo.value === 'registro') {
    const resultado = await auth.registrar(nombre.value, email.value, password.value)
    if (resultado === 'verificar') {
      modo.value = 'verificacion'
      mensaje.value = 'Te hemos enviado un código de seis cifras.'
    } else if (resultado === 'acceso') {
      await navigateTo(destino.value)
    }
    return
  }
  if (await auth.verificar(email.value, codigo.value)) await navigateTo(destino.value)
}

function cambiarModo(nuevoModo: 'acceso' | 'registro') {
  modo.value = nuevoModo
  mensaje.value = ''
  auth.error = ''
}
</script>

<template>
  <div class="pagina-cuenta">
    <main class="tarjeta-cuenta">
      <NuxtLink class="volver" to="/">← Volver al simulador</NuxtLink>
      <img class="logo-cuenta" :src="logo" alt="Gestiona tu herencia" width="200" height="49">
      <p class="kicker">Tu espacio privado</p>
      <h1>{{ modo === 'registro' ? 'Crea tu perfil' : modo === 'verificacion' ? 'Verifica tu correo' : 'Bienvenido de nuevo' }}</h1>
      <p class="lede">
        Guarda distintas posibilidades de herencia y retómalas cuando quieras.
      </p>

      <div v-if="modo !== 'verificacion'" class="selector-acceso" role="tablist" aria-label="Acceso o registro">
        <button type="button" :class="{ activo: modo === 'acceso' }" @click="cambiarModo('acceso')">Acceder</button>
        <button type="button" :class="{ activo: modo === 'registro' }" @click="cambiarModo('registro')">Crear cuenta</button>
      </div>

      <form class="formulario-cuenta" @submit.prevent="enviar">
        <label v-if="modo === 'registro'">
          Nombre
          <input v-model="nombre" required autocomplete="name">
        </label>
        <label v-if="modo !== 'verificacion'">
          Correo electrónico
          <input v-model="email" required type="email" autocomplete="email">
        </label>
        <label v-if="modo !== 'verificacion'">
          Contraseña
          <input v-model="password" required type="password" minlength="6" :autocomplete="modo === 'registro' ? 'new-password' : 'current-password'">
          <small v-if="modo === 'registro'">Como mínimo, 6 caracteres.</small>
        </label>
        <label v-else>
          Código de verificación
          <input v-model="codigo" required inputmode="numeric" maxlength="6" autocomplete="one-time-code">
        </label>
        <button type="submit" :disabled="auth.cargando">
          {{ auth.cargando ? 'Espera…' : modo === 'registro' ? 'Crear mi cuenta' : modo === 'verificacion' ? 'Verificar y acceder' : 'Acceder' }}
        </button>
      </form>

      <template v-if="modo !== 'verificacion'">
        <div class="separador"><span>o</span></div>
        <button type="button" class="boton-google" @click="auth.accederConGoogle">
          <span aria-hidden="true">G</span> Continuar con Google
        </button>
      </template>

      <p v-if="mensaje" class="exito" role="status">{{ mensaje }}</p>
      <p v-if="auth.error" class="alerta" role="alert">{{ auth.error }}</p>
      <p class="legal">Tus simulaciones son privadas y solo están disponibles dentro de tu cuenta.</p>
    </main>
  </div>
</template>
