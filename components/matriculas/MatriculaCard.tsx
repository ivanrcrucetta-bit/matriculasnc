'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { diasDesde } from '@/lib/fecha'
import { ETAPA_INFO } from '@/types'
import { calcularSLA, SLA_COLORS } from '@/lib/sla'
import type { MatriculaConPersonas, DocResumen, TipoDocumento } from '@/types'
import DocPreviewBadge from './DocPreviewBadge'

const DOCS_MOSTRAR: { tipo: TipoDocumento; short: string }[] = [
  { tipo: 'copia_matricula', short: 'Matr.' },
  { tipo: 'cedula_comprador', short: 'Ced. C' },
  { tipo: 'cedula_vendedor', short: 'Ced. V' },
]

interface MatriculaCardProps {
  matricula: MatriculaConPersonas
  documentos: DocResumen[]
}

export default function MatriculaCard({ matricula, documentos }: MatriculaCardProps) {
  const info = ETAPA_INFO[matricula.etapa]
  const comprador = matricula.personas.find((p) => p.rol === 'comprador')
  const dias = diasDesde(matricula.updated_at)
  const sla = calcularSLA(matricula.etapa, matricula.updated_at)

  const colorBorder: Record<string, string> = {
    gray: 'border-l-gray-300',
    amber: 'border-l-amber-400',
    blue: 'border-l-blue-400',
    orange: 'border-l-orange-400',
    green: 'border-l-green-500',
    teal: 'border-l-teal-500',
    emerald: 'border-l-emerald-500',
    slate: 'border-l-slate-400',
  }

  const docsMap = new Map(documentos.map((d) => [d.tipo, d]))

  return (
    <Link href={`/matriculas/${matricula.id}`}>
      <div
        className={cn(
          'bg-white border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4',
          colorBorder[info.color]
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-gray-900 truncate">
              {matricula.codigo}
            </p>
            {matricula.placa && (
              <p className="text-xs text-muted-foreground">{matricula.placa}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex-shrink-0 text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dias}d
            </span>
            {sla.nivel !== 'none' && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded border font-medium leading-none',
                  SLA_COLORS[sla.nivel]
                )}
              >
                {sla.label}
              </span>
            )}
          </div>
        </div>

        {comprador && (
          <p className="text-sm text-gray-700 mb-3 truncate">
            {comprador.nombre} {comprador.apellido}
          </p>
        )}

        {/* Indicadores de documentos con preview al hacer click */}
        <div className="flex gap-2 flex-wrap">
          {DOCS_MOSTRAR.map(({ tipo, short }) => (
            <DocPreviewBadge
              key={tipo}
              doc={docsMap.get(tipo)}
              shortLabel={short}
            />
          ))}

          {matricula.lleva_oposicion && (
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded',
                matricula.fecha_oposicion
                  ? 'bg-green-50 text-green-700'
                  : 'bg-orange-50 text-orange-600'
              )}
            >
              Opos.
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
