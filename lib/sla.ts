import type { Etapa } from '@/types'

export const SLA_CONFIG: Record<Etapa, number | null> = {
  registrada: 3,
  docs_pendientes: 7,
  docs_completos: 3,
  oposicion_pendiente: 5,
  oposicion_puesta: 7,
  traspaso_en_proceso: 45,
  traspaso_completado: 3,
  cerrado: null, // No SLA for closed
}

export interface SLAStatus {
  diasEnEtapa: number
  diasRestantes: number | null
  vencido: boolean
  nivel: 'ok' | 'warning' | 'danger' | 'none'
  label: string
}

export function calcularSLA(etapa: Etapa, updatedAt: string): SLAStatus {
  const maxDias = SLA_CONFIG[etapa]

  const ahora = new Date()
  const desde = new Date(updatedAt)
  const diasEnEtapa = Math.floor((ahora.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24))

  if (maxDias === null) {
    return {
      diasEnEtapa,
      diasRestantes: null,
      vencido: false,
      nivel: 'none',
      label: '—',
    }
  }

  const diasRestantes = maxDias - diasEnEtapa
  const vencido = diasRestantes < 0
  const porcentaje = diasEnEtapa / maxDias

  let nivel: SLAStatus['nivel'] = 'ok'
  if (vencido) {
    nivel = 'danger'
  } else if (porcentaje >= 0.75) {
    nivel = 'warning'
  }

  const label = vencido
    ? `Vencido ${Math.abs(diasRestantes)}d`
    : diasRestantes === 0
    ? 'Vence hoy'
    : `${diasRestantes}d restantes`

  return { diasEnEtapa, diasRestantes, vencido, nivel, label }
}

export const SLA_COLORS: Record<SLAStatus['nivel'], string> = {
  ok: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  none: 'bg-gray-50 text-gray-500 border-gray-200',
}
