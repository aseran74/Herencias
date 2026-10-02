export type Regimen =
  | 'comun'
  | 'cataluna'
  | 'navarra'
  | 'pais_vasco'
  | 'galicia'
  | 'aragon'
  | 'baleares'

export type RegimenEconomico =
  | 'gananciales'
  | 'separacion_bienes'
  | 'soltero_viudo'

export type SituacionConyugal =
  | 'conyuge_vivo'
  | 'viudo'
  | 'soltero'
  | 'separado_divorciado'

export type ComunidadIsd =
  | 'andalucia'
  | 'aragon'
  | 'asturias'
  | 'baleares'
  | 'canarias'
  | 'cantabria'
  | 'castilla_la_mancha'
  | 'castilla_y_leon'
  | 'cataluna'
  | 'ceuta'
  | 'extremadura'
  | 'galicia'
  | 'madrid'
  | 'melilla'
  | 'murcia'
  | 'navarra'
  | 'pais_vasco'
  | 'la_rioja'
  | 'valencia'

export interface Descendiente {
  id: string
  nombre: string
}

export interface Hijo {
  id: string
  nombre: string
  vive: boolean
  descendientes: Descendiente[]
}

export interface Inmueble {
  id: string
  nombre: string
  valorCent: number
  porcentajeCausanteBps: number
  cargasCent: number
}

export interface OtroActivo {
  id: string
  tipo: 'fondo' | 'deposito' | 'cuenta' | 'otro'
  valorCent: number
  porcentajeCausanteBps: number
}

export interface Donacion {
  beneficiarioId: string
  valorCent: number
}

export interface Reparto {
  herederoId: string
  bps: number
}

export interface BeneficiarioLibre {
  id: string
  nombre: string
  tipo: 'persona' | 'entidad'
  parentesco?: 'descendiente' | 'cercano' | 'ajeno'
}

export interface Disposiciones {
  mejora: Reparto[] | null
  libre: Reparto[] | null
}

export interface Adjudicacion {
  inmuebleId: string
  herederoId: string
  bps: number
}

export interface Input {
  regimen: Regimen
  situacionConyugal: SituacionConyugal | null
  regimenEconomico: RegimenEconomico
  inmuebles: Inmueble[]
  otrosActivos: OtroActivo[]
  deudasCent: number
  donaciones: Donacion[]
  hijos: Hijo[]
  beneficiariosLibre: BeneficiarioLibre[]
  conyugeViudo: boolean
  disposiciones: Disposiciones
  adjudicaciones: Adjudicacion[]
  comunidadIsd: ComunidadIsd | null
  quiereAlbacea: boolean | null
  nombreAlbacea: string
  flags: {
    testamentoAnterior: boolean
    hijoConDiscapacidad: boolean
    desheredacion: boolean
    empresaFamiliar: boolean
    bienesExtranjero: boolean
    pactoSucesorio: boolean
  }
}

export type CodigoError =
  | 'CAUDAL_NO_POSITIVO'
  | 'SIN_HIJOS'
  | 'MEJORA_BPS_NO_SUMA_100'
  | 'LIBRE_BPS_NO_SUMA_100'
  | 'MEJORA_SOLO_DESCENDIENTES'
  | 'HEREDERO_INEXISTENTE'
  | 'ADJUDICACION_EXCEDE_100'

export type CodigoAviso =
  | 'REPRESENTACION_PREMORIENCIA'
  | 'CONYUGE_VIUDO_USUFRUCTO_MEJORA'
  | 'REGIMEN_GANANCIALES'
  | 'DIFERENCIAS_ADJUDICACION'

export type MotivoRevision =
  | 'REGIMEN_FORAL'
  | 'TESTAMENTO_ANTERIOR'
  | 'HIJO_CON_DISCAPACIDAD'
  | 'DESHEREDACION'
  | 'EMPRESA_FAMILIAR'
  | 'BIENES_EXTRANJERO'
  | 'PACTO_SUCESORIO'
  | 'DONACIONES_PREVIAS'

export type EstadoResultado =
  | 'ok'
  | 'ok_con_avisos'
  | 'revision_obligatoria'
  | 'error'

export interface Tercios {
  estrictaCent: number
  mejoraCent: number
  libreCent: number
}

export interface DesgloseHeredero {
  herederoId: string
  nombre: string
  estrictaCent: number
  mejoraCent: number
  libreCent: number
  totalCent: number
}

export interface ResultadoAdjudicacion {
  herederoId: string
  nombre: string
  derechoCent: number
  adjudicadoCent: number
  diferenciaCent: number
}

export interface Resultado {
  estado: EstadoResultado
  errores: CodigoError[]
  avisos: CodigoAviso[]
  motivos: MotivoRevision[]
  caudalCent: number | null
  tercios: Tercios | null
  porHeredero: DesgloseHeredero[]
  adjudicacion: ResultadoAdjudicacion[]
  patrimonioPendienteAdjudicarCent: number
}
