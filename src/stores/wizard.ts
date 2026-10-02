import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { calcularSucesion, detectarCasosBloqueantes, type Input } from '../domain/succession'

export const PASOS = [
  'Régimen', 'Patrimonio', 'Familia', 'Cribado', 'Estricta',
  'Mejora', 'Libre', 'Adjudicación', 'Impuesto', 'Albacea', 'Resumen',
] as const

const inputInicial = (): Input => ({
  regimen: 'comun',
  regimenEconomico: 'soltero_viudo',
  inmuebles: [],
  otrosActivos: [],
  deudasCent: 0,
  donaciones: [],
  hijos: [],
  beneficiariosLibre: [],
  conyugeViudo: false,
  disposiciones: { mejora: null, libre: null },
  adjudicaciones: [],
  comunidadIsd: null,
  quiereAlbacea: null,
  nombreAlbacea: '',
  flags: {
    testamentoAnterior: false,
    hijoConDiscapacidad: false,
    desheredacion: false,
    empresaFamiliar: false,
    bienesExtranjero: false,
    pactoSucesorio: false,
  },
})

export const useWizardStore = defineStore('succession-wizard', () => {
  const paso = ref(1)
  const input = ref<Input>(inputInicial())
  const erroresUi = ref<string[]>([])
  const resultado = computed(() => calcularSucesion(input.value))
  const bloqueado = computed(() => detectarCasosBloqueantes(input.value).length > 0)

  const descendientes = computed(() => input.value.hijos.flatMap(hijo =>
    hijo.vive
      ? [{ id: hijo.id, nombre: hijo.nombre }]
      : hijo.descendientes.map(nieto => ({ id: nieto.id, nombre: nieto.nombre })),
  ).filter(persona => persona.nombre.trim()))

  const beneficiarios = computed(() => {
    const mapa = new Map<string, string>()
    for (const persona of descendientes.value) mapa.set(persona.id, persona.nombre)
    for (const persona of input.value.beneficiariosLibre) mapa.set(persona.id, persona.nombre)
    return [...mapa].map(([id, nombre]) => ({ id, nombre }))
  })

  function validarPaso(numero = paso.value): string[] {
    if (numero === 1) return []
    if (numero === 2) {
      const hayActivo = input.value.inmuebles.some(i => i.nombre.trim() && i.valorCent > 0)
        || input.value.otrosActivos.some(a => a.valorCent > 0)
      return hayActivo ? [] : ['Añade al menos un activo con valor.']
    }
    if (numero === 3) {
      return descendientes.value.length ? [] : ['Añade un hijo vivo o nietos de un hijo premuerto.']
    }
    if (numero === 6 && input.value.disposiciones.mejora !== null) {
      return input.value.disposiciones.mejora.reduce((s, r) => s + r.bps, 0) === 10000
        ? [] : ['La mejora debe sumar exactamente 100 %.']
    }
    if (numero === 7 && input.value.disposiciones.libre !== null) {
      return input.value.disposiciones.libre.reduce((s, r) => s + r.bps, 0) === 10000
        ? [] : ['La libre disposición debe sumar exactamente 100 %.']
    }
    if (numero === 8) {
      const sumas = new Map<string, number>()
      input.value.adjudicaciones.forEach((a) => sumas.set(a.inmuebleId, (sumas.get(a.inmuebleId) ?? 0) + a.bps))
      return [...sumas.values()].some(total => total > 10000)
        ? ['La adjudicación de un inmueble no puede superar el 100 %.'] : []
    }
    if (numero === 9) return input.value.comunidadIsd ? [] : ['Elige la comunidad donde residía el causante.']
    if (numero === 10) {
      if (input.value.quiereAlbacea === null) return ['Indica si nombras albacea.']
      if (input.value.quiereAlbacea && !input.value.nombreAlbacea.trim()) return ['Escribe el nombre del albacea.']
    }
    return []
  }

  const pasoValido = computed(() => validarPaso().length === 0)

  function avanzar() {
    erroresUi.value = validarPaso()
    if (erroresUi.value.length) return
    if (bloqueado.value && (paso.value === 1 || paso.value === 4)) {
      paso.value = PASOS.length
      return
    }
    paso.value = Math.min(PASOS.length, paso.value + 1)
  }

  function retroceder() {
    erroresUi.value = []
    paso.value = Math.max(1, paso.value - 1)
  }

  function irA(destino: number) {
    if (destino >= 1 && destino <= PASOS.length && (destino <= paso.value || destino === paso.value + 1)) {
      paso.value = destino
      erroresUi.value = []
    }
  }

  function reiniciar() {
    input.value = inputInicial()
    paso.value = 1
    erroresUi.value = []
  }

  function cargar(nuevoInput: Input, nuevoPaso: number = PASOS.length) {
    input.value = structuredClone(nuevoInput)
    paso.value = Math.min(PASOS.length, Math.max(1, nuevoPaso))
    erroresUi.value = []
  }

  return {
    paso, input, resultado, bloqueado, descendientes, beneficiarios,
    erroresUi, pasoValido, validarPaso, avanzar, retroceder, irA, reiniciar, cargar,
  }
})
