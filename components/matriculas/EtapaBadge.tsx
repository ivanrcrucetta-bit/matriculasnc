import { cn } from '@/lib/utils'
import { ETAPA_INFO } from '@/types'
import type { Etapa } from '@/types'

const colorClasses: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
}

interface EtapaBadgeProps {
  etapa: Etapa
  className?: string
}

export default function EtapaBadge({ etapa, className }: EtapaBadgeProps) {
  const info = ETAPA_INFO[etapa]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        colorClasses[info.color],
        className
      )}
    >
      {info.label}
    </span>
  )
}
