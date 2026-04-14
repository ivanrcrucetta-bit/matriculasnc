'use client'

import { useState, useTransition } from 'react'
import { Download, RefreshCw, X, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cambiarEtapaMasivo } from '@/lib/actions'
import { ETAPAS_ORDEN, ETAPA_INFO } from '@/types'
import type { Etapa, MatriculaConPersonas } from '@/types'

interface AccionesLoteProps {
  seleccionados: string[]
  matriculas: MatriculaConPersonas[]
  onDeseleccionar: () => void
}

export default function AccionesLote({
  seleccionados,
  matriculas,
  onDeseleccionar,
}: AccionesLoteProps) {
  const [showEtapas, setShowEtapas] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (seleccionados.length === 0) return null

  const seleccionadasData = matriculas.filter((m) => seleccionados.includes(m.id))

  function exportarCSV() {
    const headers = ['Código', 'Placa', 'Cliente', 'Etapa', 'Cód. cliente', 'Días']
    const rows = seleccionadasData.map((m) => {
      const comprador = m.personas.find((p) => p.rol === 'comprador')
      return [
        m.codigo,
        m.placa ?? '',
        comprador ? `${comprador.nombre} ${comprador.apellido}` : '',
        ETAPA_INFO[m.etapa].label,
        m.numero_credito ?? '',
        String(Math.floor((Date.now() - new Date(m.updated_at).getTime()) / 86400000)),
      ]
    })

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `matriculas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${seleccionados.length} matrículas exportadas`)
  }

  function cambiarEtapa(etapa: Etapa) {
    setShowEtapas(false)
    startTransition(async () => {
      try {
        await cambiarEtapaMasivo(seleccionados, etapa)
        toast.success(`${seleccionados.length} matrículas actualizadas a "${ETAPA_INFO[etapa].label}"`)
        onDeseleccionar()
      } catch {
        toast.error('Error al cambiar etapas')
      }
    })
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[320px]">
      <span className="text-sm font-medium flex-1">
        {seleccionados.length} seleccionada{seleccionados.length !== 1 ? 's' : ''}
      </span>

      <Button
        size="sm"
        variant="ghost"
        onClick={exportarCSV}
        className="text-white hover:bg-white/10 gap-1.5"
      >
        <Download className="h-3.5 w-3.5" />
        CSV
      </Button>

      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowEtapas(!showEtapas)}
          disabled={isPending}
          className="text-white hover:bg-white/10 gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Etapa
          <ChevronDown className="h-3 w-3" />
        </Button>

        {showEtapas && (
          <div className="absolute bottom-full mb-2 right-0 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50">
            {ETAPAS_ORDEN.map((etapa) => (
              <button
                key={etapa}
                onClick={() => cambiarEtapa(etapa)}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
              >
                {ETAPA_INFO[etapa].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onDeseleccionar}
        className="p-1 hover:bg-white/10 rounded-md transition-colors"
        aria-label="Deseleccionar todo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
