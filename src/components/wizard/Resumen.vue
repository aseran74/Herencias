<script setup lang="ts">
import { computed, ref } from 'vue'
import { centimosAEuros } from '../../composables/useSuccession'
import { TEXTOS_LEGALES } from '../../content/legal'
import { COMUNIDADES_ISD, estimarIsd } from '../../domain/succession'
import { useWizardStore } from '../../stores/wizard'
const store = useWizardStore()
const contacto = ref({ nombre: '', email: '', telefono: '', consentimiento_rgpd: false })
const enviando = ref(false)
const estadoEnvio = ref<'reposo' | 'exito' | 'error'>('reposo')
const maximo = computed(() => Math.max(1, ...store.resultado.porHeredero.map(p => p.totalCent)))
const receptoresLibre = computed(() =>
  store.resultado.porHeredero.filter(persona => persona.libreCent > 0),
)
const estimacion = computed(() => estimarIsd(store.input, store.resultado))
const albaceaLista = computed(() => {
  if (store.input.quiereAlbacea === null) return false
  return !store.input.quiereAlbacea || store.input.nombreAlbacea.trim().length >= 2
})
const etiquetasError: Record<string, string> = {
  CAUDAL_NO_POSITIVO: 'El caudal no es positivo.',
  SIN_HIJOS: 'No hay estirpes para repartir.',
  MEJORA_BPS_NO_SUMA_100: 'La mejora no suma 100 %.',
  LIBRE_BPS_NO_SUMA_100: 'La libre disposición no suma 100 %.',
  MEJORA_SOLO_DESCENDIENTES: 'La mejora solo puede asignarse a descendientes.',
  HEREDERO_INEXISTENTE: 'Hay un destinatario que ya no existe.',
  ADJUDICACION_EXCEDE_100: 'Una adjudicación supera el 100 %.',
}
const etiquetasAviso: Record<string, string> = {
  REPRESENTACION_PREMORIENCIA: 'Hay representación por premoriencia.',
  CONYUGE_VIUDO_USUFRUCTO_MEJORA: 'El cónyuge viudo puede tener usufructo sobre el tercio de mejora.',
  REGIMEN_GANANCIALES: 'Solo se computa la participación del causante en los bienes gananciales.',
  DIFERENCIAS_ADJUDICACION: 'La adjudicación presenta diferencias que pueden requerir compensación.',
}
const etiquetasMotivo: Record<string, string> = {
  REGIMEN_FORAL: 'La vecindad civil indicada tiene derecho foral.',
  TESTAMENTO_ANTERIOR: 'Existe un testamento anterior.',
  HIJO_CON_DISCAPACIDAD: 'Hay un descendiente con discapacidad.',
  DESHEREDACION: 'Se plantea una desheredación.',
  EMPRESA_FAMILIAR: 'Existe empresa familiar.',
  BIENES_EXTRANJERO: 'Hay bienes en el extranjero.',
  PACTO_SUCESORIO: 'Existe un pacto sucesorio.',
  DONACIONES_PREVIAS: 'Hay donaciones previas.',
}
async function enviar() {
  if (!contacto.value.consentimiento_rgpd) return
  enviando.value = true
  estadoEnvio.value = 'reposo'
  try {
    await $fetch('/api/leads', { method: 'POST', body: { input: store.input, contacto: contacto.value } })
    estadoEnvio.value = 'exito'
  } catch {
    estadoEnvio.value = 'error'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section aria-labelledby="titulo-resumen">
    <p class="kicker">10 · Resumen</p>
    <h2 id="titulo-resumen">{{ store.resultado.estado === 'revision_obligatoria' ? 'Tu caso requiere revisión' : 'Resultado orientativo' }}</h2>

    <div v-if="store.resultado.caudalCent !== null" class="magnitudes">
      <div><span>Caudal</span><strong>{{ centimosAEuros(store.resultado.caudalCent) }}</strong></div>
      <template v-if="store.resultado.tercios">
        <div><span>Estricta</span><strong>{{ centimosAEuros(store.resultado.tercios.estrictaCent) }}</strong></div>
        <div><span>Mejora</span><strong>{{ centimosAEuros(store.resultado.tercios.mejoraCent) }}</strong></div>
        <div><span>Libre disposición</span><strong>{{ centimosAEuros(store.resultado.tercios.libreCent) }}</strong></div>
      </template>
    </div>

    <div v-if="store.resultado.estado === 'revision_obligatoria'" class="revision" data-testid="resumen-bloqueante">
      <p>{{ TEXTOS_LEGALES.revision }}</p>
      <ul><li v-for="motivo in store.resultado.motivos" :key="motivo">{{ etiquetasMotivo[motivo] }}</li></ul>
    </div>
    <div v-else-if="store.resultado.errores.length" class="alerta" role="alert">
      <p v-for="error in store.resultado.errores" :key="error">{{ etiquetasError[error] }}</p>
    </div>
    <template v-else>
      <section class="libre-resumen" data-testid="resumen-libre">
        <h3>Libre disposición</h3>
        <p v-if="store.input.disposiciones.libre === null" class="nota">
          No se señaló destinatario: este tercio se reparte entre las estirpes.
        </p>
        <ul class="lista-limpia">
          <li v-for="persona in receptoresLibre" :key="persona.herederoId">
            <span>{{ persona.nombre }}</span>
            <strong>{{ centimosAEuros(persona.libreCent) }}</strong>
          </li>
        </ul>
      </section>
      <p class="leyenda-tercios">
        <span><i class="muestra estricta" /> Estricta</span>
        <span><i class="muestra mejora" /> Mejora</span>
        <span><i class="muestra libre" /> Libre disposición</span>
      </p>
      <div class="barras" aria-label="Reparto por heredero">
        <article v-for="persona in store.resultado.porHeredero" :key="persona.herederoId">
          <header><strong>{{ persona.nombre }}</strong><span>{{ centimosAEuros(persona.totalCent) }}</span></header>
          <div class="barra-apilada" :style="{ width: `${persona.totalCent / maximo * 100}%` }">
            <span v-if="persona.estrictaCent" class="segmento estricta" :style="{ flex: persona.estrictaCent }" />
            <span v-if="persona.mejoraCent" class="segmento mejora" :style="{ flex: persona.mejoraCent }" />
            <span v-if="persona.libreCent" class="segmento libre" :style="{ flex: persona.libreCent }" />
          </div>
          <p class="desglose-persona">
            Estricta {{ centimosAEuros(persona.estrictaCent) }}
            · Mejora {{ centimosAEuros(persona.mejoraCent) }}
            · Libre {{ centimosAEuros(persona.libreCent) }}
          </p>
        </article>
      </div>
      <ul v-if="store.resultado.avisos.length" class="avisos">
        <li v-for="aviso in store.resultado.avisos" :key="aviso">{{ etiquetasAviso[aviso] }}</li>
      </ul>
      <div v-if="store.resultado.adjudicacion.length" class="diferencias">
        <h3>Diferencias de adjudicación</h3>
        <p v-for="fila in store.resultado.adjudicacion" :key="fila.herederoId">
          <span>{{ fila.nombre }}</span><strong>{{ centimosAEuros(fila.diferenciaCent) }}</strong>
        </p>
        <p><span>Pendiente de adjudicar</span><strong>{{ centimosAEuros(store.resultado.patrimonioPendienteAdjudicarCent) }}</strong></p>
      </div>
    </template>

    <label v-if="!store.input.comunidadIsd" class="campo-suelto">
      Comunidad de residencia habitual del causante
      <select v-model="store.input.comunidadIsd" data-testid="comunidad-isd">
        <option :value="null" disabled>Elige una comunidad</option>
        <option v-for="comunidad in COMUNIDADES_ISD" :key="comunidad.id" :value="comunidad.id">{{ comunidad.nombre }}</option>
      </select>
    </label>

    <section v-if="estimacion" class="libre-resumen" data-testid="resumen-isd">
      <h3>Impuesto de sucesiones · {{ estimacion.nombreComunidad }}</h3>
      <p v-if="estimacion.totalCent !== null"><strong>{{ centimosAEuros(estimacion.totalCent) }}</strong> estimados entre todos los perceptores.</p>
      <ul v-if="estimacion.porHeredero.length" class="lista-limpia">
        <li v-for="persona in estimacion.porHeredero" :key="persona.herederoId">
          <span>{{ persona.nombre }}</span>
          <strong>{{ persona.cuotaCent === null ? 'A calcular' : centimosAEuros(persona.cuotaCent) }}</strong>
        </li>
      </ul>
      <p v-for="nota in estimacion.notas" :key="nota" class="nota">{{ nota }}</p>
      <p class="nota">{{ TEXTOS_LEGALES.avisoIsd }}</p>
    </section>

    <fieldset class="cribado" data-testid="albacea">
      <legend>¿Quieres nombrar albacea?</legend>
      <div class="pregunta">
        <span>La persona que hará cumplir el testamento.</span>
        <label><input v-model="store.input.quiereAlbacea" data-testid="albacea-si" type="radio" name="albacea" :value="true"> Sí</label>
        <label><input v-model="store.input.quiereAlbacea" data-testid="albacea-no" type="radio" name="albacea" :value="false"> No</label>
      </div>
      <label v-if="store.input.quiereAlbacea" class="campo-suelto">
        Nombre del albacea
        <input v-model="store.input.nombreAlbacea" data-testid="albacea-nombre" autocomplete="name">
      </label>
    </fieldset>

    <form class="lead" data-testid="formulario-lead" @submit.prevent="enviar">
      <h3>{{ store.resultado.estado === 'revision_obligatoria' ? 'Solicita una revisión' : 'Revisa el resultado con el despacho' }}</h3>
      <label>Nombre<input v-model="contacto.nombre" required autocomplete="name"></label>
      <label>Email<input v-model="contacto.email" required type="email" autocomplete="email"></label>
      <label>Teléfono<input v-model="contacto.telefono" required type="tel" autocomplete="tel"></label>
      <label class="check"><input v-model="contacto.consentimiento_rgpd" data-testid="consentimiento" type="checkbox" required> {{ TEXTOS_LEGALES.consentimiento }}</label>
      <a href="/privacidad">{{ TEXTOS_LEGALES.privacidad }}</a>
      <button type="submit" :disabled="enviando || !contacto.consentimiento_rgpd || !albaceaLista">{{ enviando ? 'Enviando…' : 'Hablar con el despacho' }}</button>
      <p v-if="estadoEnvio === 'exito'" class="exito" role="status">Solicitud enviada. Te contactaremos pronto.</p>
      <p v-if="estadoEnvio === 'error'" class="alerta" role="alert">No se pudo enviar. Inténtalo de nuevo.</p>
    </form>
    <p class="legal">{{ TEXTOS_LEGALES.avisoGeneral }} {{ TEXTOS_LEGALES.articulos }}</p>
  </section>
</template>
