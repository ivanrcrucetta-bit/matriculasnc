import type { TipoDocumento } from '@/types'

/**
 * Procesa imágenes en el browser via Canvas API (sin librerías externas).
 * - Redimensiona conservando relación de aspecto al máximo definido.
 * - Exporta siempre como image/jpeg para minimizar el peso.
 * - Aplica rotación manual y respeta orientación EXIF automáticamente.
 * - Soporta ajuste opcional de contraste para mejorar legibilidad.
 */

export const CALIDAD_DOC = 0.82
export const MAX_PX_DOC = 1920

export interface PresetDoc {
  maxPx: number
  calidad: number
}

// Calibraciones por tipo de documento. Cédulas requieren nitidez alta para
// lectura de caracteres pequeños, contratos precisan más píxeles pero pueden
// tolerar mayor compresión.
export const PRESETS_POR_TIPO: Record<TipoDocumento, PresetDoc> = {
  copia_matricula: { maxPx: 2000, calidad: 0.82 },
  cedula_comprador: { maxPx: 1600, calidad: 0.85 },
  cedula_vendedor: { maxPx: 1600, calidad: 0.85 },
  contrato_venta: { maxPx: 2400, calidad: 0.8 },
  fotocopia_matricula_vigente: { maxPx: 2000, calidad: 0.82 },
  comprobante_dgii: { maxPx: 1800, calidad: 0.82 },
  carta_credito: { maxPx: 2000, calidad: 0.82 },
  certificado_deuda: { maxPx: 2000, calidad: 0.82 },
  poder_notarial: { maxPx: 2400, calidad: 0.8 },
  carta_no_objecion: { maxPx: 2000, calidad: 0.82 },
  contrato_prenda: { maxPx: 2400, calidad: 0.8 },
  acuse_entrega: { maxPx: 2000, calidad: 0.82 },
  otro: { maxPx: MAX_PX_DOC, calidad: CALIDAD_DOC },
}

export interface OpcionesImagen {
  rotacion?: 0 | 90 | 180 | 270
  maxPx?: number
  calidad?: number
  tipo?: TipoDocumento
  mejorarContraste?: boolean
  respetarExif?: boolean
  /**
   * Recorta automáticamente los bordes uniformes (fondo) alrededor del
   * contenido. Útil para capturas de cámara sobre superficies contrastadas.
   */
  autoRecortar?: boolean
}

export function esImagen(file: File): boolean {
  return /^image\/(jpeg|png|webp|gif)$/i.test(file.type)
}

/**
 * Lee la orientación EXIF (tag 0x0112) de un JPEG.
 * Retorna 1-8 según el estándar EXIF, o 1 (por defecto) si no se detecta.
 */
async function leerOrientacionExif(file: File): Promise<number> {
  if (file.type !== 'image/jpeg') return 1
  const head = file.slice(0, Math.min(file.size, 131072))
  const buffer = await head.arrayBuffer()
  const view = new DataView(buffer)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1

  let offset = 2
  while (offset < view.byteLength - 2) {
    const marker = view.getUint16(offset)
    offset += 2
    if (marker === 0xffe1) {
      const exifLen = view.getUint16(offset)
      if (view.getUint32(offset + 2) !== 0x45786966) return 1 // "Exif"
      const tiffOffset = offset + 8
      const little = view.getUint16(tiffOffset) === 0x4949
      const getU16 = (o: number) => view.getUint16(o, little)
      const getU32 = (o: number) => view.getUint32(o, little)
      if (getU16(tiffOffset + 2) !== 0x002a) return 1
      const dirOffset = tiffOffset + getU32(tiffOffset + 4)
      const entries = getU16(dirOffset)
      for (let i = 0; i < entries; i++) {
        const entryOffset = dirOffset + 2 + i * 12
        if (getU16(entryOffset) === 0x0112) {
          return getU16(entryOffset + 8)
        }
      }
      offset += exifLen
    } else if ((marker & 0xff00) !== 0xff00) {
      break
    } else {
      offset += view.getUint16(offset)
    }
  }
  return 1
}

/**
 * Convierte la orientación EXIF (1-8) al par {rotate, flip} que aplica el canvas.
 */
function transformacionPorOrientacion(o: number): {
  rotate: 0 | 90 | 180 | 270
  flipH: boolean
} {
  switch (o) {
    case 2:
      return { rotate: 0, flipH: true }
    case 3:
      return { rotate: 180, flipH: false }
    case 4:
      return { rotate: 180, flipH: true }
    case 5:
      return { rotate: 90, flipH: true }
    case 6:
      return { rotate: 90, flipH: false }
    case 7:
      return { rotate: 270, flipH: true }
    case 8:
      return { rotate: 270, flipH: false }
    default:
      return { rotate: 0, flipH: false }
  }
}

/**
 * Calcula un bounding box heurístico del contenido descartando bordes uniformes.
 * Compara la luminancia de cada fila/columna con la del color de fondo
 * (promedio de las 4 esquinas). Pensado para documentos sobre superficies
 * de color contrastado; degrada con elegancia cuando el fondo es ruidoso.
 */
function detectarBoundingBox(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  umbralLuminancia = 20
): { x: number; y: number; w: number; h: number } | null {
  const { data } = ctx.getImageData(0, 0, w, h)
  const lum = (i: number) =>
    0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]

  const esquinas = [
    lum(0),
    lum((w - 1) * 4),
    lum((h - 1) * w * 4),
    lum(((h - 1) * w + (w - 1)) * 4),
  ]
  const fondo = esquinas.reduce((a, b) => a + b, 0) / 4

  const difFila = new Float32Array(h)
  const difCol = new Float32Array(w)
  // Muestreo: cada ~2 px para acelerar sin perder precisión útil.
  const paso = Math.max(1, Math.floor(Math.min(w, h) / 800))

  for (let y = 0; y < h; y += paso) {
    let maxDif = 0
    for (let x = 0; x < w; x += paso) {
      const d = Math.abs(lum((y * w + x) * 4) - fondo)
      if (d > maxDif) maxDif = d
    }
    difFila[y] = maxDif
  }
  for (let x = 0; x < w; x += paso) {
    let maxDif = 0
    for (let y = 0; y < h; y += paso) {
      const d = Math.abs(lum((y * w + x) * 4) - fondo)
      if (d > maxDif) maxDif = d
    }
    difCol[x] = maxDif
  }

  let top = 0
  while (top < h && difFila[top] < umbralLuminancia) top += paso
  let bottom = h - 1
  while (bottom > top && difFila[bottom] < umbralLuminancia) bottom -= paso
  let left = 0
  while (left < w && difCol[left] < umbralLuminancia) left += paso
  let right = w - 1
  while (right > left && difCol[right] < umbralLuminancia) right -= paso

  const pad = Math.round(Math.min(w, h) * 0.01)
  const x = Math.max(0, left - pad)
  const y = Math.max(0, top - pad)
  const rectW = Math.min(w - x, right - left + 1 + pad * 2)
  const rectH = Math.min(h - y, bottom - top + 1 + pad * 2)

  // Si el recorte elimina menos del 4% o deja un rectángulo degenerado, omitir.
  const areaOrig = w * h
  const areaNueva = rectW * rectH
  if (areaNueva / areaOrig > 0.96) return null
  if (rectW < w * 0.3 || rectH < h * 0.3) return null
  return { x, y, w: rectW, h: rectH }
}

export async function procesarImagen(
  file: File,
  opciones: OpcionesImagen = {}
): Promise<File> {
  const preset = opciones.tipo
    ? PRESETS_POR_TIPO[opciones.tipo]
    : { maxPx: MAX_PX_DOC, calidad: CALIDAD_DOC }
  const {
    rotacion = 0,
    maxPx = preset.maxPx,
    calidad = preset.calidad,
    mejorarContraste = false,
    respetarExif = true,
    autoRecortar = false,
  } = opciones

  const exifOrient = respetarExif ? await leerOrientacionExif(file) : 1
  const exifTx = transformacionPorOrientacion(exifOrient)

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width)
          width = maxPx
        } else {
          width = Math.round((width * maxPx) / height)
          height = maxPx
        }
      }

      // Combinar rotación manual con rotación EXIF
      const rotacionTotal = ((rotacion + exifTx.rotate) % 360) as 0 | 90 | 180 | 270
      const girado = rotacionTotal === 90 || rotacionTotal === 270
      const canvasW = girado ? height : width
      const canvasH = girado ? width : height

      const canvas = document.createElement('canvas')
      canvas.width = canvasW
      canvas.height = canvasH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas no disponible'))
        return
      }

      if (mejorarContraste) {
        ctx.filter = 'contrast(1.15) saturate(0.9) brightness(1.02)'
      }

      ctx.translate(canvasW / 2, canvasH / 2)
      ctx.rotate((rotacionTotal * Math.PI) / 180)
      if (exifTx.flipH) ctx.scale(-1, 1)
      ctx.drawImage(img, -width / 2, -height / 2, width, height)

      // Auto-crop tras todas las rotaciones para preservar orientación.
      let finalCanvas: HTMLCanvasElement = canvas
      if (autoRecortar) {
        const bbox = detectarBoundingBox(ctx, canvasW, canvasH)
        if (bbox) {
          const recorte = document.createElement('canvas')
          recorte.width = bbox.w
          recorte.height = bbox.h
          const rctx = recorte.getContext('2d')
          if (rctx) {
            rctx.drawImage(
              canvas,
              bbox.x,
              bbox.y,
              bbox.w,
              bbox.h,
              0,
              0,
              bbox.w,
              bbox.h
            )
            finalCanvas = recorte
          }
        }
      }

      finalCanvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Error al procesar imagen'))
          const nombre = file.name.replace(/\.[^.]+$/, '') + '.jpg'
          resolve(new File([blob], nombre, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        calidad
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo cargar la imagen'))
    }

    img.src = url
  })
}
