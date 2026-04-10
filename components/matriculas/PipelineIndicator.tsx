import { CheckCircle, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ETAPA_INFO } from '@/types'
import { etapasVisibles, indicePorcentajeEtapa } from '@/lib/pipeline'
import type { Matricula } from '@/types'

const colorDot: Record<string, string> = {
  gray: 'bg-gray-300',
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  orange: 'bg-orange-400',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-500',
}

interface PipelineIndicatorProps {
  matricula: Matricula
}

export default function PipelineIndicator({ matricula }: PipelineIndicatorProps) {
  const visibles = etapasVisibles(matricula)
  const etapaActual = matricula.etapa
  const idxActual = visibles.indexOf(etapaActual)
  const pct = indicePorcentajeEtapa(matricula, etapaActual)

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-nc-green transition-all duration-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Etapas */}
      <div className="grid gap-1.5">
        {visibles.map((etapa, idx) => {
          const info = ETAPA_INFO[etapa]
          const completada = idx < idxActual
          const activa = etapa === etapaActual
          const futura = idx > idxActual

          return (
            <div
              key={etapa}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                activa && 'bg-nc-green-light border border-nc-green/30',
                completada && 'text-muted-foreground',
                futura && 'text-muted-foreground/50'
              )}
            >
              <div className="flex-shrink-0">
                {completada ? (
                  <CheckCircle className="h-4 w-4 text-nc-green" />
                ) : activa ? (
                  <Clock className="h-4 w-4 text-nc-green" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'font-medium',
                    activa && 'text-nc-green-dark',
                    completada && 'line-through opacity-60'
                  )}
                >
                  {info.label}
                </span>
              </div>
              {activa && (
                <div className={cn('w-2 h-2 rounded-full', colorDot[info.color])} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
