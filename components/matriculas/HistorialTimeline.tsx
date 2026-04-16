import {
  Upload,
  Trash2,
  Shield,
  ShieldOff,
  ArrowLeftRight,
  CheckCircle,
  MessageSquare,
  XCircle,
  Plus,
  PackageCheck,
} from 'lucide-react'
import { formatFechaHora } from '@/lib/fecha'
import type { EventoHistorial, TipoEvento } from '@/types'

const icono: Record<TipoEvento, React.ComponentType<{ className?: string }>> = {
  creacion: Plus,
  cambio_etapa: ArrowLeftRight,
  documento_subido: Upload,
  documento_eliminado: Trash2,
  oposicion_registrada: Shield,
  oposicion_retirada: ShieldOff,
  traspaso_iniciado: ArrowLeftRight,
  traspaso_completado: CheckCircle,
  entrega_registrada: PackageCheck,
  nota_agregada: MessageSquare,
  cierre: XCircle,
}

const colorIcono: Record<TipoEvento, string> = {
  creacion: 'bg-nc-green-light text-nc-green',
  cambio_etapa: 'bg-blue-50 text-blue-600',
  documento_subido: 'bg-green-50 text-green-600',
  documento_eliminado: 'bg-red-50 text-red-600',
  oposicion_registrada: 'bg-orange-50 text-orange-600',
  oposicion_retirada: 'bg-gray-100 text-gray-500',
  traspaso_iniciado: 'bg-teal-50 text-teal-600',
  traspaso_completado: 'bg-emerald-50 text-emerald-600',
  entrega_registrada: 'bg-emerald-100 text-emerald-700',
  nota_agregada: 'bg-purple-50 text-purple-600',
  cierre: 'bg-slate-100 text-slate-600',
}

interface HistorialTimelineProps {
  historial: EventoHistorial[]
}

export default function HistorialTimeline({ historial }: HistorialTimelineProps) {
  if (historial.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Sin historial de actividad
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-gray-800 text-sm mb-3">Historial de actividad</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {historial.map((evento) => {
            const Icon = icono[evento.tipo_evento]
            const color = colorIcono[evento.tipo_evento]

            return (
              <div key={evento.id} className="flex gap-4 relative pl-0">
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-gray-800">{evento.descripcion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">
                      {formatFechaHora(evento.created_at)}
                    </p>
                    {evento.usuario_nombre && (
                      <>
                        <span className="text-muted-foreground/50 text-xs">·</span>
                        <p className="text-xs text-muted-foreground">{evento.usuario_nombre}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
