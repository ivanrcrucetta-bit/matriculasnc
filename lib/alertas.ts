import { diasDesde } from '@/lib/fecha'
import type { MatriculaConPersonas, AlertaSeveridad, SeveridadAlerta } from '@/types'

export interface SnoozeRecord {
  matricula_id: string
  tipo_alerta: string
  snooze_until: string
}

function isSnoozed(
  matriculaId: string,
  tipo: string,
  snoozes: SnoozeRecord[]
): boolean {
  const snooze = snoozes.find(
    (s) => s.matricula_id === matriculaId && s.tipo_alerta === tipo
  )
  if (!snooze) return false
  return new Date(snooze.snooze_until) > new Date()
}

export function calcularAlertas(
  matriculas: MatriculaConPersonas[],
  docsPorMat: Record<string, string[]>,
  snoozes: SnoozeRecord[] = []
): AlertaSeveridad[] {
  const alertas: AlertaSeveridad[] = []

  for (const m of matriculas) {
    if (m.etapa === 'cerrado') continue

    const comprador = m.personas?.find((p) => p.rol === 'comprador')
    const nombreComprador = comprador
      ? `${comprador.nombre} ${comprador.apellido}`
      : '—'

    const tipos = docsPorMat[m.id] ?? []
    const diasDesdeCreacion = diasDesde(m.created_at)
    const diasDesdeUpdate = diasDesde(m.updated_at)
    const diasDesdeTraspaso = m.fecha_traspaso ? diasDesde(m.fecha_traspaso) : 0

    // Sin documentos
    if (m.etapa === 'registrada' && tipos.length === 0 && diasDesdeCreacion > 3) {
      const tipo = 'sin_docs'
      if (!isSnoozed(m.id, tipo, snoozes)) {
        const severidad: SeveridadAlerta =
          diasDesdeCreacion > 7 ? 'critica' : 'media'
        alertas.push({
          id: `${m.id}-${tipo}`,
          matricula_id: m.id,
          codigo: m.codigo,
          placa: m.placa,
          comprador: nombreComprador,
          tipo,
          descripcion: `Registrada hace ${diasDesdeCreacion} días sin ningún documento`,
          diasTranscurridos: diasDesdeCreacion,
          severidad,
          updated_at: m.updated_at,
        })
      }
    }

    // Oposición pendiente
    if (
      m.lleva_oposicion &&
      !m.fecha_oposicion &&
      ['docs_completos', 'oposicion_pendiente'].includes(m.etapa) &&
      diasDesdeUpdate > 5
    ) {
      const tipo = 'oposicion_pendiente'
      if (!isSnoozed(m.id, tipo, snoozes)) {
        alertas.push({
          id: `${m.id}-${tipo}`,
          matricula_id: m.id,
          codigo: m.codigo,
          placa: m.placa,
          comprador: nombreComprador,
          tipo,
          descripcion: `Sin registrar oposición desde hace ${diasDesdeUpdate} días`,
          diasTranscurridos: diasDesdeUpdate,
          severidad: 'critica',
          updated_at: m.updated_at,
        })
      }
    }

    // Traspaso lento
    if (m.etapa === 'traspaso_en_proceso' && diasDesdeTraspaso > 45) {
      const tipo = 'traspaso_lento'
      if (!isSnoozed(m.id, tipo, snoozes)) {
        alertas.push({
          id: `${m.id}-${tipo}`,
          matricula_id: m.id,
          codigo: m.codigo,
          placa: m.placa,
          comprador: nombreComprador,
          tipo,
          descripcion: `Traspaso en proceso hace ${diasDesdeTraspaso} días`,
          diasTranscurridos: diasDesdeTraspaso,
          severidad: 'media',
          updated_at: m.updated_at,
        })
      }
    }

    // Sin actividad
    if (diasDesdeUpdate > 15) {
      const tipo = 'sin_actividad'
      if (!isSnoozed(m.id, tipo, snoozes)) {
        alertas.push({
          id: `${m.id}-${tipo}`,
          matricula_id: m.id,
          codigo: m.codigo,
          placa: m.placa,
          comprador: nombreComprador,
          tipo,
          descripcion: `Sin actualización en ${diasDesdeUpdate} días`,
          diasTranscurridos: diasDesdeUpdate,
          severidad: 'baja',
          updated_at: m.updated_at,
        })
      }
    }
  }

  // Sort: crítica first, then by days descending
  const ORDEN: Record<SeveridadAlerta, number> = { critica: 0, media: 1, baja: 2 }
  alertas.sort((a, b) => {
    const diff = ORDEN[a.severidad] - ORDEN[b.severidad]
    if (diff !== 0) return diff
    return b.diasTranscurridos - a.diasTranscurridos
  })

  return alertas
}

export const SEVERIDAD_INFO: Record<SeveridadAlerta, {
  label: string
  bgColor: string
  textColor: string
  borderColor: string
}> = {
  critica: {
    label: 'Crítica',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  media: {
    label: 'Media',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  baja: {
    label: 'Baja',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
  },
}
