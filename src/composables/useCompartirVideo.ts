export function nombreArchivoVideo(prefijo = 'grabacion'): string {
  const fecha = new Date().toISOString().slice(0, 10)
  return `${prefijo}-${fecha}.webm`
}

export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}

export async function compartirArchivoVideo(
  blob: Blob,
  opciones: { titulo?: string; texto?: string; nombre?: string } = {},
): Promise<'compartido' | 'descargado' | 'error'> {
  const nombre = opciones.nombre || nombreArchivoVideo()
  const archivo = new File([blob], nombre, { type: blob.type || 'video/webm' })
  const titulo = opciones.titulo || 'Grabación de herencia'
  const texto = opciones.texto || 'Te mando la grabación de mi voluntad sucesoria (orientativa, no es testamento).'

  try {
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ title: titulo, text: texto, files: [archivo] })
      return 'compartido'
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'error'
  }

  try {
    descargarBlob(blob, nombre)
    return 'descargado'
  } catch {
    return 'error'
  }
}

export function urlWhatsApp(texto: string, url = ''): string {
  const mensaje = [texto, url].filter(Boolean).join('\n')
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`
}

export function urlEmail(asunto: string, cuerpo: string): string {
  return `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}
