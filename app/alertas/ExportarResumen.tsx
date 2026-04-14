'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AlertaSeveridad } from '@/types'

interface ExportarResumenProps {
  alertas: AlertaSeveridad[]
}

export default function ExportarResumen({ alertas }: ExportarResumenProps) {
  function handleExport() {
    const headers = ['Código', 'Placa', 'Cliente', 'Tipo', 'Descripción', 'Severidad', 'Días']
    const rows = alertas.map((a) => [
      a.codigo,
      a.placa ?? '',
      a.comprador,
      a.tipo.replace(/_/g, ' '),
      a.descripcion,
      a.severidad,
      String(a.diasTranscurridos),
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alertas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
      <Download className="h-4 w-4" />
      Exportar CSV ({alertas.length})
    </Button>
  )
}
