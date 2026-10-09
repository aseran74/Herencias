import { jsPDF } from 'jspdf'
import type { Clausula } from './borrador'

function envolver(doc: jsPDF, texto: string, x: number, y: number, ancho: number, altoLinea: number): number {
  const lineas = doc.splitTextToSize(texto, ancho) as string[]
  for (const linea of lineas) {
    if (y > 280) {
      doc.addPage()
      y = 20
    }
    doc.text(linea, x, y)
    y += altoLinea
  }
  return y
}

export function descargarBorradorPdf(clausulas: Clausula[], nombreArchivo = 'borrador-testamento.pdf') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margen = 20
  const ancho = 170
  let y = 22

  doc.setFont('times', 'bold')
  doc.setFontSize(16)
  y = envolver(doc, 'Borrador orientativo de testamento abierto', margen, y, ancho, 8)
  y += 4
  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  y = envolver(
    doc,
    'Documento orientativo. No es escritura pública ni produce efectos jurídicos por sí solo. Debe ser revisado por despacho o notario.',
    margen,
    y,
    ancho,
    5,
  )
  y += 6

  for (const clausula of clausulas) {
    if (y > 260) {
      doc.addPage()
      y = 20
    }
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    y = envolver(doc, clausula.titulo, margen, y, ancho, 6)
    y += 2
    doc.setFont('times', 'normal')
    doc.setFontSize(11)
    for (const parrafo of clausula.parrafos) {
      y = envolver(doc, parrafo, margen, y, ancho, 5.5)
      y += 3
    }
    y += 4
  }

  doc.save(nombreArchivo)
}
