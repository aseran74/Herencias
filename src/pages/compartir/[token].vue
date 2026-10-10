<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import logo from '../../assets/logo-gestiona-tu-herencia.png'
import { urlEmail, urlWhatsApp } from '../../composables/useCompartirVideo'

const route = useRoute()
const token = computed(() => String(route.params.token || ''))
const cargando = ref(true)
const error = ref('')
const videoUrl = ref('')
const nombre = ref('')
const urgente = ref(false)
const copiado = ref(false)

const enlacePublico = computed(() => {
  if (!import.meta.client) return ''
  return `${window.location.origin}/compartir/${token.value}`
})

const textoCompartir = computed(() =>
  urgente.value
    ? 'Te mando el enlace a mi grabación de urgencia sobre la herencia (es orientativa, no es testamento).'
    : 'Te mando el enlace a mi grabación express sobre la herencia (es orientativa, no es testamento).',
)

onMounted(async () => {
  try {
    const data = await $fetch<{ videoUrl: string; nombre: string; urgente: boolean }>(`/api/compartir/${token.value}`)
    videoUrl.value = data.videoUrl
    nombre.value = data.nombre
    urgente.value = data.urgente
  } catch {
    error.value = 'Este enlace no es válido o el vídeo ya no está disponible.'
  } finally {
    cargando.value = false
  }
})

async function copiarEnlace() {
  try {
    await navigator.clipboard.writeText(enlacePublico.value)
    copiado.value = true
  } catch {
    copiado.value = false
  }
}

async function compartirNativo() {
  if (!navigator.share) return
  try {
    await navigator.share({
      title: 'Grabación de herencia',
      text: textoCompartir.value,
      url: enlacePublico.value,
    })
  } catch {
    // cancelado
  }
}
</script>

<template>
  <div class="pagina-compartir">
    <main class="tarjeta-compartir">
      <NuxtLink class="volver" to="/">← Volver al simulador</NuxtLink>
      <img class="logo-compartir" :src="logo" alt="Gestiona tu herencia" width="200" height="49">
      <p class="kicker">Compartir grabación</p>
      <h1>{{ urgente ? 'Grabación de urgencia' : 'Grabación express' }}</h1>
      <p class="lede">
        {{ nombre ? `Grabación de ${nombre}.` : 'Grabación guardada.' }}
        Es una prueba orientativa de voluntad; no sustituye un testamento notarial.
      </p>

      <p v-if="cargando" class="nota">Cargando vídeo…</p>
      <p v-else-if="error" class="alerta" role="alert">{{ error }}</p>
      <template v-else>
        <video :src="videoUrl" class="video-compartir" controls playsinline />
        <div class="acciones-compartir">
          <a class="boton-wa" :href="urlWhatsApp(textoCompartir, enlacePublico)" target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <a class="secundario" :href="urlEmail('Grabación de herencia', `${textoCompartir}\n\n${enlacePublico}`)">
            Email
          </a>
          <button type="button" class="secundario" @click="copiarEnlace">
            {{ copiado ? 'Enlace copiado' : 'Copiar enlace' }}
          </button>
          <button v-if="typeof navigator !== 'undefined' && navigator.share" type="button" class="texto" @click="compartirNativo">
            Más opciones
          </button>
        </div>
        <p class="nota">Puedes reenviar este enlace por WhatsApp, email u otras apps. El vídeo permanece guardado en el despacho.</p>
      </template>
    </main>
  </div>
</template>
