'use client'

import Link from 'next/link'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ETAPA_INFO } from '@/types'
import { calcularSLA, SLA_COLORS } from '@/lib/sla'
import EtapaBadge from './EtapaBadge'
import type { MatriculaConPersonas, DocResumen, TipoDocumento } from '@/types'

const DOCS_PRINCIPALES: TipoDocumento[] = [
  'copia_matricula',
  'cedula_comprador',
  'cedula_vendedor',
]

interface MatriculaCardListProps {
  matriculas: MatriculaConPersonas[]
  documentosPorMatricula: Record<string, DocResumen[]>
}

export default function MatriculaCardList({
  matriculas,
  documentosPorMatricula,
}: MatriculaCardListProps) {
  if (matriculas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay matrículas para mostrar
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {matriculas.map((m) => {
        const info = ETAPA_INFO[m.etapa]
        const comprador = m.personas.find((p) => p.rol === 'comprador')
        const docs = documentosPorMatricula[m.id] ?? []
        const docsMap = new Map(docs.map((d) => [d.tipo, d]))
        const docsOk = DOCS_PRINCIPALES.every((t) => docsMap.has(t))
        const dias = Math.floor(
          (Date.now() - new Date(m.updated_at).getTime()) / 86400000
        )
        const sla = calcularSLA(m.etapa, m.updated_at)

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

        return (
          <Link key={m.id} href={`/matriculas/${m.id}`}>
            <div
              className={cn(
                'bg-white border border-border rounded-lg p-4 hover:shadow-sm transition-shadow border-l-4',
                colorBorder[info.color]
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {m.codigo}
                    </span>
                    {m.placa && (
                      <span className="text-xs text-muted-foreground">· {m.placa}</span>
                    )}
                  </div>
                  {comprador && (
                    <p className="text-sm text-gray-700 mt-0.5 truncate">
                      {comprador.nombre} {comprador.apellido}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <EtapaBadge etapa={m.etapa} />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {dias}d
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {docsOk ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                  )}
                  <span>{docsOk ? 'Docs OK' : 'Docs faltantes'}</span>
                </div>

                {sla.nivel !== 'none' && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border font-medium',
                      SLA_COLORS[sla.nivel]
                    )}
                  >
                    {sla.label}
                  </span>
                )}

                {m.numero_credito && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    Créd: {m.numero_credito}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
