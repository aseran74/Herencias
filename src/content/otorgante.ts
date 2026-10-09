export interface DatosOtorgante {
  nombre: string
  dni: string
  domicilio: string
  localidad: string
}

export function otorganteVacio(): DatosOtorgante {
  return { nombre: '', dni: '', domicilio: '', localidad: '' }
}

export function nombreOtorgante(datos: DatosOtorgante | string): string {
  if (typeof datos === 'string') return datos.trim()
  return datos.nombre.trim()
}

export function textoComparecencia(datos: DatosOtorgante, situacionPersonal: string): string {
  const quien = datos.nombre.trim() || '________________________________'
  const dni = datos.dni.trim() || '________________'
  const domicilio = datos.domicilio.trim() || '________________'
  const localidad = datos.localidad.trim() || '________________'
  return `Ante mí, notario, comparece ${quien}, mayor de edad, con DNI/NIE ${dni}, con domicilio en ${domicilio}, localidad de ${localidad}, ${situacionPersonal}, con vecindad civil común. Manifiesta que otorga testamento abierto conforme al derecho común español.`
}
