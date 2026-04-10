import {
  format,
  formatDistanceToNow,
  differenceInDays,
  parseISO,
  isValid,
} from 'date-fns'
import { es } from 'date-fns/locale'

export function formatFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—'
  const d = typeof fecha === 'string' ? parseISO(fecha) : fecha
  if (!isValid(d)) return '—'
  return format(d, 'dd/MM/yyyy', { locale: es })
}

export function formatFechaHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—'
  const d = typeof fecha === 'string' ? parseISO(fecha) : fecha
  if (!isValid(d)) return '—'
  return format(d, "dd/MM/yyyy 'a las' HH:mm", { locale: es })
}

export function formatRelativo(fecha: string | Date | null | undefined): string {
  if (!fecha) return '—'
  const d = typeof fecha === 'string' ? parseISO(fecha) : fecha
  if (!isValid(d)) return '—'
  return formatDistanceToNow(d, { addSuffix: true, locale: es })
}

export function diasDesde(fecha: string | Date | null | undefined): number {
  if (!fecha) return 0
  const d = typeof fecha === 'string' ? parseISO(fecha) : fecha
  if (!isValid(d)) return 0
  return differenceInDays(new Date(), d)
}

export function formatISO(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd')
}
