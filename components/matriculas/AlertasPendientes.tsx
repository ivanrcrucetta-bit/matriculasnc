'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface AlertaItem {
  id: string
  codigo: string
  placa: string | null
  comprador: string
  tipo: 'sin_docs' | 'oposicion_pendiente' | 'traspaso_lento' | 'sin_actividad'
  diasTranscurridos: number
  updated_at: string
}

const TIPO_LABELS: Record<AlertaItem['tipo'], string> = {
  sin_docs: 'Sin documentos hace +3 días',
  oposicion_pendiente: 'Oposición pendiente hace +5 días',
  traspaso_lento: 'Traspaso lleva +45 días en proceso',
  sin_actividad: 'Sin actividad hace +15 días',
}

const TIPO_COLOR: Record<AlertaItem['tipo'], string> = {
  sin_docs: 'text-amber-600 bg-amber-50 border-amber-200',
  oposicion_pendiente: 'text-orange-600 bg-orange-50 border-orange-200',
  traspaso_lento: 'text-red-600 bg-red-50 border-red-200',
  sin_actividad: 'text-gray-600 bg-gray-50 border-gray-200',
}

interface AlertasPendientesProps {
  alertas: AlertaItem[]
}

export default function AlertasPendientes({ alertas }: AlertasPendientesProps) {
  const [open, setOpen] = useState(true)

  if (alertas.length === 0) return null

  return (
    <div className="border border-amber-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-amber-800">
            {alertas.length} {alertas.length === 1 ? 'matrícula requiere' : 'matrículas requieren'} atención inmediata
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-amber-100">
          {alertas.map((alerta) => (
            <div key={`${alerta.id}-${alerta.tipo}`} className="px-4 py-3 bg-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {alerta.codigo}
                    </span>
                    {alerta.placa && (
                      <span className="text-xs text-muted-foreground">
                        · {alerta.placa}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      · {alerta.comprador}
                    </span>
                  </div>
                  <span
                    className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded-full border ${TIPO_COLOR[alerta.tipo]}`}
                  >
                    {TIPO_LABELS[alerta.tipo]}
                  </span>
                </div>
                <Link href={`/matriculas/${alerta.id}`}>
                  <Button size="sm" variant="outline" className="flex-shrink-0 gap-1">
                    Ver
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
