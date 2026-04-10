import { Card, CardContent } from '@/components/ui/card'
import {
  FileText,
  AlertTriangle,
  FileX,
  ArrowLeftRight,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    activas: number
    oposicionPendiente: number
    docsFaltantes: number
    traspasosEnProceso: number
    cerradasEsteMes: number
    sinActividadMas15: number
  }
}

const items = [
  {
    key: 'activas' as const,
    label: 'Matrículas Activas',
    icon: FileText,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    alerta: false,
  },
  {
    key: 'oposicionPendiente' as const,
    label: 'Oposición Pendiente',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    alerta: true,
  },
  {
    key: 'docsFaltantes' as const,
    label: 'Documentos Faltantes',
    icon: FileX,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    alerta: true,
  },
  {
    key: 'traspasosEnProceso' as const,
    label: 'Traspasos en Proceso',
    icon: ArrowLeftRight,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    alerta: false,
  },
  {
    key: 'cerradasEsteMes' as const,
    label: 'Cerradas Este Mes',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    alerta: false,
  },
  {
    key: 'sinActividadMas15' as const,
    label: 'Sin Actividad +15 días',
    icon: Clock,
    color: 'text-red-600',
    bg: 'bg-red-50',
    alerta: true,
  },
]

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(({ key, label, icon: Icon, color, bg, alerta }) => {
        const valor = stats[key]
        const esAlerta = alerta && valor > 0

        return (
          <Card
            key={key}
            className={cn(
              'transition-shadow hover:shadow-md',
              esAlerta && 'ring-1 ring-red-200'
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p
                    className={cn(
                      'text-3xl font-bold mt-1',
                      esAlerta ? 'text-red-600' : 'text-gray-900'
                    )}
                  >
                    {valor}
                  </p>
                </div>
                <div className={cn('p-2 rounded-lg', bg)}>
                  <Icon className={cn('h-5 w-5', esAlerta ? 'text-red-500' : color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
