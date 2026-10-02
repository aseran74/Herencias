<script setup lang="ts">
import { computed, ref } from 'vue'
import { centimosAEuros } from '../../composables/useSuccession'
import { guardarPendiente } from '../../composables/useGuardadoPendiente'
import { useSimulaciones } from '../../composables/useSimulaciones'
import { TEXTOS_LEGALES } from '../../content/legal'
import { redactarBorrador } from '../../content/borrador'
import { COMUNIDADES_ISD, estimarIsd } from '../../domain/succession'
import { useAuthStore } from '../../stores/auth'
import { useWizardStore } from '../../stores/wizard'
const store = useWizardStore()
const auth = useAuthStore()
const contacto = ref({ nombre: '', email: '', telefono: '', consentimiento_rgpd: false })
const tituloSimulacion = ref('Herencia familiar')
const guardando = ref(false)
const estadoGuardado = ref<'reposo' | 'exito' | 'error'>('reposo')
const enviando = ref(false)
const estadoEnvio = ref<'reposo' | 'exito' | 'error'>('reposo')
const maximo = computed(() => Math.max(1, ...store.resultado.porHeredero.map(p => p.totalCent)))
const receptoresLibre = computed(() =>
  store.resultado.porHeredero.filter(persona => persona.libreCent > 0),
)
const estimacion = computed(() => estimarIsd(store.input, store.resultado))
const borrador = computed(() => redactarBorrador(store.input, store.resultado, contacto.value.nombre))
const albaceaLista = computed(() => {
  if (store.input.quiereAlbacea === null) return false
  return !store.input.quiereAlbacea || store.input.nombreAlbacea.trim().length > 0
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
function imprimirBorrador() {
  const nodo = document.querySelector('[data-testid="borrador"]')
  if (!nodo) return
  const ventana = window.open('', '_blank', 'noopener,noreferrer')
  if (!ventana) return
  ventana.document.write(`<!doctype html><html lang="es"><head><title>Borrador de testamento</title><style>body{font-family:Georgia,serif;max-width:42rem;margin:2rem auto;color:#1d1a16;line-height:1.55}h3{font-size:1.15rem;margin:1.3rem 0 .35rem}p{margin:.35rem 0}.no-imprimir{display:none}</style></head><body>${nodo.innerHTML}</body></html>`)
  ventana.document.close()
  ventana.focus()
  ventana.print()
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

async function guardarSimulacion() {
  const titulo = tituloSimulacion.value.trim()
  if (titulo.length < 2) return
  estadoGuardado.value = 'reposo'
  if (!auth.user) {
    guardarPendiente({ titulo, input: store.input, paso: store.paso })
    await navigateTo('/acceso?siguiente=/perfil?guardar=pendiente')
    return
  }
  guardando.value = true
  try {
    await useSimulaciones().guardar(auth.user.id, titulo, store.input, store.paso)
    estadoGuardado.value = 'exito'
  } catch {
    estadoGuardado.value = 'error'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <section aria-labelledby="titulo-resumen">
    <p class="kicker">11 · Resumen</p>
    <h2 id="titulo-resumen">{{ store.resultado.estado === 'revision_obligatoria' ? 'Tu caso requiere revisión' : 'Resultado orientativo' }}</h2>

    <section
      v-if="store.input.situacionConyugal === 'conyuge_vivo' && store.resultado.caudalCent !== null"
      class="lectura-conyuge"
      aria-labelledby="lectura-resultado-conyuge"
    >
      <p class="kicker">Cómo leer el resultado</p>
      <h3 id="lectura-resultado-conyuge">El cónyuge aparece en dos momentos distintos</h3>
      <div class="flujo-conyuge">
        <article v-if="store.input.regimenEconomico === 'gananciales'">
          <span>1 · Liquidación de gananciales</span>
          <strong>{{ centimosAEuros(store.resultado.parteConyugeGanancialCent) }}</strong>
          <p>Es la mitad neta de los bienes marcados como gananciales. Ya pertenece al cónyuge y queda fuera de la herencia.</p>
        </article>
        <article>
          <span>{{ store.input.regimenEconomico === 'gananciales' ? '2' : '1' }} · Herencia del causante</span>
          <strong>{{ centimosAEuros(store.resultado.caudalCent) }}</strong>
          <p>Es lo que se divide en legítima estricta, mejora y libre disposición.</p>
        </article>
        <article v-if="store.resultado.usufructoConyuge">
          <span>{{ store.input.regimenEconomico === 'gananciales' ? '3' : '2' }} · Usufructo viudal</span>
          <strong>Sobre {{ centimosAEuros(store.resultado.usufructoConyuge.baseMejoraCent) }}</strong>
          <p>Esta cifra es la base afectada por el usufructo, no dinero adicional para el cónyuge. No se ha calculado su valor económico.</p>
        </article>
      </div>
    </section>

    <div v-if="store.resultado.caudalCent !== null" class="magnitudes">
      <div v-if="store.resultado.parteConyugeGanancialCent > 0" class="magnitud-conyuge">
        <span>Mitad ganancial del cónyuge · fuera de la herencia</span>
        <strong>{{ centimosAEuros(store.resultado.parteConyugeGanancialCent) }}</strong>
      </div>
      <div><span>Caudal hereditario del causante</span><strong>{{ centimosAEuros(store.resultado.caudalCent) }}</strong></div>
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
      <section v-if="store.resultado.usufructoConyuge" class="usufructo-conyuge" data-testid="usufructo-conyuge">
        <p class="kicker">Derecho legal del cónyuge</p>
        <h3>Usufructo del tercio de mejora</h3>
        <p>
          La base sometida al usufructo es
          <strong>{{ centimosAEuros(store.resultado.usufructoConyuge.baseMejoraCent) }}</strong>.
          No es una cantidad adicional ni una valoración económica del usufructo.
        </p>
        <ul class="lista-limpia">
          <li v-for="persona in store.resultado.usufructoConyuge.porDescendiente" :key="persona.herederoId">
            <span>Mejora atribuida a {{ persona.nombre }}</span>
            <strong>{{ centimosAEuros(persona.baseUsufructoCent) }}</strong>
          </li>
        </ul>
        <p class="nota">Estas atribuciones a los descendientes quedan sujetas al usufructo legal del cónyuge no separado. Su valoración requiere revisión profesional.</p>
      </section>
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

    <article v-if="borrador" class="borrador" data-testid="borrador">
      <p class="kicker">Borrador para el notario</p>
      <h3>Testamento abierto</h3>
      <p class="nota">{{ TEXTOS_LEGALES.avisoBorrador }}</p>
      <section v-for="clausula in borrador" :key="clausula.titulo">
        <h3>{{ clausula.titulo }}</h3>
        <p v-for="(parrafo, indice) in clausula.parrafos" :key="indice">{{ parrafo }}</p>
      </section>
      <button type="button" class="secundario no-imprimir" data-testid="imprimir-borrador" @click="imprimirBorrador">Imprimir borrador</button>
    </article>

    <section class="guardar-simulacion" aria-labelledby="titulo-guardar">
      <div>
        <p class="kicker">Tu perfil</p>
        <h3 id="titulo-guardar">Guarda esta posible herencia</h3>
        <p>Conserva una copia privada para retomarla o compararla con otro escenario.</p>
      </div>
      <form @submit.prevent="guardarSimulacion">
        <label>
          Nombre de la simulación
          <input v-model="tituloSimulacion" required minlength="2" maxlength="100">
        </label>
        <button type="submit" :disabled="guardando">
          {{ guardando ? 'Guardando…' : auth.autenticado ? 'Guardar en mi perfil' : 'Acceder y guardar' }}
        </button>
      </form>
      <p v-if="estadoGuardado === 'exito'" class="exito" role="status">Simulación guardada en tu perfil.</p>
      <p v-if="estadoGuardado === 'error'" class="alerta" role="alert">No se pudo guardar. Inténtalo de nuevo.</p>
    </section>

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
