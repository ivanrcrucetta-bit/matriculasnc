/**
 * Procesa imágenes en el browser via Canvas API (sin librerías externas).
 * - Redimensiona conservando relación de aspecto al máximo definido.
 * - Exporta siempre como image/jpeg para minimizar el peso.
 * - Aplica rotación (0, 90, 180, 270 grados) en el mismo paso.
 *
 * Parámetros por defecto calibrados para documentos de identidad / vehículos:
 * legibilidad de texto y firmas con ~60-80 % de reducción respecto al original de celular.
 */

export const CALIDAD_DOC = 0.82
export const MAX_PX_DOC = 1920

export interface OpcionesImagen {
  rotacion?: 0 | 90 | 180 | 270
  maxPx?: number
  calidad?: number
}

export async function procesarImagen(
  file: File,
  opciones: OpcionesImagen = {}
): Promise<File> {
  const { rotacion = 0, maxPx = MAX_PX_DOC, calidad = CALIDAD_DOC } = opciones

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Redimensionar al lado mayor si supera maxPx
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height * maxPx) / width)
          width = maxPx
        } else {
          width = Math.round((width * maxPx) / height)
          height = maxPx
        }
      }

      const girado = rotacion === 90 || rotacion === 270
      const canvasW = girado ? height : width
      const canvasH = girado ? width : height

      const canvas = document.createElement('canvas')
      canvas.width = canvasW
      canvas.height = canvasH
      const ctx = canvas.getContext('2d')!

      ctx.translate(canvasW / 2, canvasH / 2)
      ctx.rotate((rotacion * Math.PI) / 180)
      ctx.drawImage(img, -width / 2, -height / 2, width, height)

      canvas.toBlob(
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

export function esImagen(file: File): boolean {
  return /^image\/(jpeg|png|webp|gif)$/i.test(file.type)
}
