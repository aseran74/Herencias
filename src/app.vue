<script setup lang="ts">
import { onMounted } from 'vue'
import { leerPendiente } from './composables/useGuardadoPendiente'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
onMounted(async () => {
  await auth.hidratar()
  if (auth.user && leerPendiente()) await navigateTo('/perfil')
})
</script>

<template>
  <div class="sitio">
    <BarraSuperior />
    <NuxtPage />
  </div>
</template>
