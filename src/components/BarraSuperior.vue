<script setup lang="ts">
import logo from '../assets/logo-gestiona-tu-herencia.png'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<template>
  <header class="barra">
    <div class="pastilla">
      <NuxtLink class="marca" to="/" aria-label="Gestiona tu herencia">
        <img
          class="marca-logo"
          :src="logo"
          alt="Gestiona tu herencia"
          width="220"
          height="54"
        >
      </NuxtLink>
      <nav class="cuenta-nav" aria-label="Cuenta">
        <template v-if="auth.autenticado">
          <NuxtLink class="perfil-enlace" to="/perfil">
            <img v-if="auth.avatar" :src="auth.avatar" alt="">
            <span>{{ auth.nombre }}</span>
          </NuxtLink>
          <button type="button" @click="auth.cerrarSesion">Cerrar sesión</button>
        </template>
        <NuxtLink v-else class="acceso-enlace" to="/acceso">Acceder</NuxtLink>
      </nav>
    </div>
  </header>
</template>
