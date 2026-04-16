'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

interface ExpedientePDFProps {
  matriculaId: string
  codigo: string
}

/**
 * Descarga el expediente PDF desde el Route Handler server-side.
 * Reemplaza el @react-pdf client-side: el PDF se genera en el servidor y
 * @react-pdf/renderer ya no viaja al bundle cliente.
 */
export default function ExpedientePDF({ matriculaId, codigo }: ExpedientePDFProps) {
  return (
    <Button variant="outline" className="w-full gap-2" asChild>
      <a
        href={`/api/matriculas/${matriculaId}/expediente`}
        target="_blank"
        rel="noopener noreferrer"
        download={`expediente-${codigo}.pdf`}
      >
        <FileDown className="h-4 w-4" />
        Descargar Expediente PDF
      </a>
    </Button>
  )
}
