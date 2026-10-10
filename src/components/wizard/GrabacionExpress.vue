<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue'
import { compartirArchivoVideo, descargarBlob, nombreArchivoVideo } from '../../composables/useCompartirVideo'

const grabacion = defineModel<Blob | null>({ default: null })
const props = withDefaults(defineProps<{
  tope?: number
  guion?: string
  nota?: string
  nombreArchivo?: string
}>(), {
  tope: 30,
  guion: '',
  nota: 'El vídeo es opcional y dura como máximo 30 segundos. Di quién hereda y si quieres firmar pronto.',
  nombreArchivo: 'grabacion-herencia',
})

const error = ref('')
const aviso = ref('')
const grabando = ref(false)
const previsualizacion = ref('')
const visor = ref<HTMLVideoElement | null>(null)
const segundos = ref(0)

let media: MediaRecorder | null = null
let camara: MediaStream | null = null
let temporizador: ReturnType<typeof setInterval> | null = null
const trozos: Blob[] = []

onUnmounted(() => detenerCamara())

async function empezar() {
  error.value = ''
  aviso.value = ''
  borrar()
  try {
    camara = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
      audio: true,
    })
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm'
    media = new MediaRecorder(camara, {
      mimeType: mime,
      videoBitsPerSecond: props.tope > 60 ? 250_000 : 400_000,
      audioBitsPerSecond: 64_000,
    })
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
      if (segundos.value >= props.tope) parar()
    }, 1000)
    media.start()
  } catch {
    detenerCamara()
    error.value = 'No se pudo abrir la cámara. Puedes enviar el texto sin vídeo.'
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
  aviso.value = ''
}

function detenerCamara() {
  camara?.getTracks().forEach(pista => pista.stop())
  camara = null
  media = null
}

function descargar() {
  if (!grabacion.value) return
  descargarBlob(grabacion.value, nombreArchivoVideo(props.nombreArchivo))
  aviso.value = 'Vídeo guardado en tu dispositivo.'
}

async function compartir() {
  if (!grabacion.value) return
  const resultado = await compartirArchivoVideo(grabacion.value, {
    titulo: 'Grabación de herencia',
    texto: 'Te mando la grabación de mi voluntad sucesoria (orientativa, no es testamento).',
    nombre: nombreArchivoVideo(props.nombreArchivo),
  })
  if (resultado === 'compartido') aviso.value = 'Vídeo compartido.'
  else if (resultado === 'descargado') aviso.value = 'Tu dispositivo no permite compartir el archivo aquí. Se ha descargado para que lo envíes por WhatsApp o email.'
  else aviso.value = 'No se pudo compartir. Prueba a descargarlo.'
}
</script>

<template>
  <div class="grabacion-express" data-testid="grabacion-express">
    <p class="nota">{{ nota }}</p>
    <div v-if="guion" class="guion-lectura" data-testid="guion-lectura">
      <p class="kicker">Texto para leer en voz alta</p>
      <p>{{ guion }}</p>
    </div>
    <div class="acciones-grabacion">
      <button v-if="!grabando && !grabacion" type="button" data-testid="grabar-express" @click="empezar">
        {{ guion ? 'Grabar leyendo el texto' : 'Grabar mensaje' }}
      </button>
      <button v-else-if="grabando" type="button" class="secundario" data-testid="parar-express" @click="parar">
        Parar ({{ segundos }}s / {{ tope }}s)
      </button>
      <button v-else type="button" class="secundario" @click="empezar">Volver a grabar</button>
      <button v-if="grabacion" type="button" class="texto" @click="borrar">Quitar vídeo</button>
    </div>
    <div v-if="grabacion" class="acciones-compartir-local">
      <button type="button" class="secundario" data-testid="descargar-video" @click="descargar">Guardar en el móvil</button>
      <button type="button" data-testid="compartir-video" @click="compartir">Compartir (WhatsApp, email…)</button>
    </div>
    <video v-if="grabando" ref="visor" class="video-express" autoplay muted playsinline></video>
    <video v-else-if="previsualizacion" :src="previsualizacion" class="video-express" controls playsinline></video>
    <p v-if="aviso" class="exito" role="status">{{ aviso }}</p>
    <p v-if="error" class="nota">{{ error }}</p>
  </div>
</template>
