import { PDFDocument } from 'pdf-lib'

/**
 * Combina múltiples imágenes (JPEG/PNG) en un único PDF A4.
 * Cada imagen ocupa una página completa, manteniendo su relación de aspecto
 * con un pequeño margen. Úsalo para escaneos multipágina desde cámara.
 */
export interface CombinarImagenesOpciones {
  /** Nombre final del archivo PDF (sin extensión). */
  nombre?: string
  /** Margen uniforme en puntos PDF (1in = 72pt). Por defecto 18pt. */
  margenPt?: number
  /** Tamaño de página en puntos. Por defecto A4 vertical (595x842). */
  tamanioPagina?: { width: number; height: number }
}

const A4 = { width: 595.28, height: 841.89 }

async function embeberImagen(doc: PDFDocument, file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (/png/i.test(file.type) || /\.png$/i.test(file.name)) {
    return doc.embedPng(bytes)
  }
  return doc.embedJpg(bytes)
}

export async function combinarImagenesAPdf(
  imagenes: File[],
  opciones: CombinarImagenesOpciones = {}
): Promise<File> {
  if (imagenes.length === 0) {
    throw new Error('No hay imágenes para combinar')
  }

  const {
    nombre = 'documento-multipagina',
    margenPt = 18,
    tamanioPagina = A4,
  } = opciones

  const pdf = await PDFDocument.create()

  for (const img of imagenes) {
    const embedded = await embeberImagen(pdf, img)
    const page = pdf.addPage([tamanioPagina.width, tamanioPagina.height])

    const availW = tamanioPagina.width - margenPt * 2
    const availH = tamanioPagina.height - margenPt * 2
    const scale = Math.min(availW / embedded.width, availH / embedded.height)
    const drawW = embedded.width * scale
    const drawH = embedded.height * scale
    const x = (tamanioPagina.width - drawW) / 2
    const y = (tamanioPagina.height - drawH) / 2

    page.drawImage(embedded, { x, y, width: drawW, height: drawH })
  }

  const bytes = await pdf.save()
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: 'application/pdf',
  })
  const safeName = nombre.replace(/[^\w\-]+/g, '-').replace(/^-|-$/g, '')
  return new File([blob], `${safeName || 'documento'}.pdf`, {
    type: 'application/pdf',
  })
}
