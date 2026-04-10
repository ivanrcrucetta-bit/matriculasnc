'use client'

import Link from 'next/link'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { diasDesde } from '@/lib/fecha'
import { ETAPA_INFO } from '@/types'
import type { MatriculaConPersonas, TipoDocumento } from '@/types'

const DOCS_MOSTRAR: TipoDocumento[] = [
  'copia_matricula',
  'cedula_comprador',
  'cedula_vendedor',
]

interface MatriculaCardProps {
  matricula: MatriculaConPersonas
  documentosTipos: TipoDocumento[]
}

export default function MatriculaCard({ matricula, documentosTipos }: MatriculaCardProps) {
  const info = ETAPA_INFO[matricula.etapa]
  const comprador = matricula.personas.find((p) => p.rol === 'comprador')
  const dias = diasDesde(matricula.updated_at)

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
          <span className="flex-shrink-0 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dias}d
          </span>
        </div>

        {comprador && (
          <p className="text-sm text-gray-700 mb-3 truncate">
            {comprador.nombre} {comprador.apellido}
          </p>
        )}

        {/* Indicadores de documentos */}
        <div className="flex gap-2 flex-wrap">
          {DOCS_MOSTRAR.map((tipo) => {
            const tiene = documentosTipos.includes(tipo)
            const shortLabel: Record<TipoDocumento, string> = {
              copia_matricula: 'Matr.',
              cedula_comprador: 'Ced. C',
              cedula_vendedor: 'Ced. V',
              contrato_venta: 'Contrato',
              otro: 'Otro',
            }
            return (
              <span
                key={tipo}
                className={cn(
                  'flex items-center gap-1 text-xs px-1.5 py-0.5 rounded',
                  tiene
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                )}
              >
                {tiene ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {shortLabel[tipo]}
              </span>
            )
          })}

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
