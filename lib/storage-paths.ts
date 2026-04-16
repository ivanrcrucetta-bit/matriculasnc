import type { TipoDocumento } from '@/types'

/**
 * Utilidades para construir rutas de Storage seguras y predecibles.
 *
 * Supabase Storage trata los paths como claves S3: espacios, tildes, ñ y
 * caracteres no-ASCII generan URLs rotas o necesitan encoding manual.
 * Sanitizamos a ASCII kebab-case y garantizamos una extensión limpia.
 */

const MAX_SLUG_LEN = 60

export function slugifyNombre(raw: string): string {
  const sinExt = raw.replace(/\.[^.]+$/, '')
  const normalizado = sinExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[ñÑ]/g, 'n')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LEN)
  return normalizado || 'archivo'
}

export function extensionLimpia(file: { name: string; type?: string }): string {
  const match = /\.([a-zA-Z0-9]{1,6})$/.exec(file.name)
  if (match) return match[1].toLowerCase()
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'bin'
}

export interface BuildDocPathInput {
  matriculaId: string
  tipo: TipoDocumento
  file: { name: string; type?: string }
  timestamp?: number
}

/**
 * Genera un storage_path estable y ASCII-safe:
 *   {matriculaId}/{tipo}/{timestamp}-{slug}.{ext}
 */
export function buildDocPath({
  matriculaId,
  tipo,
  file,
  timestamp = Date.now(),
}: BuildDocPathInput): string {
  const slug = slugifyNombre(file.name)
  const ext = extensionLimpia(file)
  return `${matriculaId}/${tipo}/${timestamp}-${slug}.${ext}`
}

/**
 * Versión "nombre bonito" para mostrar al usuario, manteniendo nombre original
 * pero saneando solo caracteres prohibidos en nombres de archivo.
 */
export function nombreArchivoLimpio(raw: string): string {
  return raw.replace(/[\x00-\x1f<>:"/\\|?*]+/g, '_').slice(0, 120) || 'archivo'
}
