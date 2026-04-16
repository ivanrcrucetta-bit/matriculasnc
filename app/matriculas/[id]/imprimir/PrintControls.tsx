'use client'

import { Printer, ArrowLeft, FileDown } from 'lucide-react'

interface PrintControlsProps {
  matriculaId: string
  expedienteHref?: string
}

/**
 * Barra flotante de acciones en la página de impresión. Oculta automáticamente
 * al imprimir. Usa el endpoint server-side para el expediente PDF.
 */
export default function PrintControls({
  matriculaId,
  expedienteHref,
}: PrintControlsProps) {
  return (
    <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
      {expedienteHref && (
        <a
          href={expedienteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
        >
          <FileDown className="h-4 w-4" />
          Expediente PDF
        </a>
      )}
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-1.5"
      >
        <Printer className="h-4 w-4" />
        Imprimir
      </button>
      <a
        href={`/matriculas/${matriculaId}`}
        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </a>
    </div>
  )
}
