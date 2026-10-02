import type {
  CodigoAviso,
  Input,
  MotivoRevision,
} from './types'

export function detectarCasosBloqueantes(input: Input): MotivoRevision[] {
  const motivos: MotivoRevision[] = []

  if (input.regimen !== 'comun') motivos.push('REGIMEN_FORAL')
  if (input.flags.testamentoAnterior) motivos.push('TESTAMENTO_ANTERIOR')
  if (input.flags.hijoConDiscapacidad) motivos.push('HIJO_CON_DISCAPACIDAD')
  if (input.flags.desheredacion) motivos.push('DESHEREDACION')
  if (input.flags.empresaFamiliar) motivos.push('EMPRESA_FAMILIAR')
  if (input.flags.bienesExtranjero) motivos.push('BIENES_EXTRANJERO')
  if (input.flags.pactoSucesorio) motivos.push('PACTO_SUCESORIO')
  if (input.donaciones.length > 0) motivos.push('DONACIONES_PREVIAS')

  return motivos
}

export function detectarAvisos(input: Input): CodigoAviso[] {
  const avisos: CodigoAviso[] = []

  if (input.hijos.some(hijo => !hijo.vive && hijo.descendientes.length > 0)) {
    avisos.push('REPRESENTACION_PREMORIENCIA')
  }
  if (input.conyugeViudo) {
    avisos.push('CONYUGE_VIUDO_USUFRUCTO_MEJORA')
  }
  if (input.regimenEconomico === 'gananciales') {
    avisos.push('REGIMEN_GANANCIALES')
  }

  return avisos
}
