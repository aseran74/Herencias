<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue'

const grabacion = defineModel<Blob | null>({ default: null })
const error = ref('')
const grabando = ref(false)
const previsualizacion = ref('')
const visor = ref<HTMLVideoElement | null>(null)
const segundos = ref(0)
const tope = 30

let media: MediaRecorder | null = null
let camara: MediaStream | null = null
let temporizador: ReturnType<typeof setInterval> | null = null
const trozos: Blob[] = []

onUnmounted(() => detenerCamara())

async function empezar() {
  error.value = ''
  borrar()
  try {
    camara = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm'
    media = new MediaRecorder(camara, { mimeType: mime })
    media.ondataavailable = (evento) => {
      if (evento.data.size) trozos.push(evento.data)
    }
    media.onstop = finalizar
    grabando.value = true
    segundos.value = 0
    await nextTick()
    if (visor.value) visor.value.srcObject = camara
    temporizador = setInterval(() => {
      segundos.value += 1
      if (segundos.value >= tope) parar()
    }, 1000)
    media.start()
  } catch {
    detenerCamara()
    error.value = 'No se pudo abrir la cámara. Puedes pedir la cita express sin vídeo.'
  }
}

function parar() {
  if (media && media.state !== 'inactive') media.stop()
}

function finalizar() {
  grabando.value = false
  if (temporizador) clearInterval(temporizador)
  temporizador = null
  detenerCamara()
  if (!trozos.length) return
  grabacion.value = new Blob(trozos, { type: 'video/webm' })
  previsualizacion.value = URL.createObjectURL(grabacion.value)
  trozos.length = 0
}

function borrar() {
  if (previsualizacion.value) URL.revokeObjectURL(previsualizacion.value)
  previsualizacion.value = ''
  grabacion.value = null
  segundos.value = 0
  trozos.length = 0
}

function detenerCamara() {
  camara?.getTracks().forEach(pista => pista.stop())
  camara = null
  media = null
}
</script>

<template>
  <div class="grabacion-express" data-testid="grabacion-express">
    <p class="nota">El vídeo es opcional y dura como máximo {{ tope }} segundos. Di quién hereda y si quieres firmar pronto.</p>
    <div class="acciones-grabacion">
      <button v-if="!grabando && !grabacion" type="button" data-testid="grabar-express" @click="empezar">
        Grabar mensaje
      </button>
      <button v-else-if="grabando" type="button" class="secundario" data-testid="parar-express" @click="parar">
        Parar ({{ segundos }}s / {{ tope }}s)
      </button>
      <button v-else type="button" class="secundario" @click="empezar">Volver a grabar</button>
      <button v-if="grabacion" type="button" class="texto" @click="borrar">Quitar vídeo</button>
    </div>
    <video v-if="grabando" ref="visor" class="video-express" autoplay muted playsinline></video>
    <video v-else-if="previsualizacion" :src="previsualizacion" class="video-express" controls playsinline></video>
    <p v-if="error" class="nota">{{ error }}</p>
  </div>
</template>
