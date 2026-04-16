'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import PdfRasterizer from '@/components/print/PdfRasterizer'
import { Loader2 } from 'lucide-react'

type Doc = {
  id: string
  tipo: string
  nombre_archivo: string
  signedUrl: string | null
}

function esImagen(n: string) {
  return /\.(jpe?g|png|webp)$/i.test(n)
}
function esPDF(n: string) {
  return /\.pdf$/i.test(n)
}

interface Props {
  documentos: Doc[]
  /** Si true, lanza window.print() tras cargar todo. */
  autoPrint?: boolean
}

/**
 * Renderiza cada documento para impresión, rasterizando PDFs a imágenes
 * para que window.print() imprima SU contenido (no funcionan los <iframe>).
 *
 * Espera a que todos los recursos estén decodificados antes de imprimir,
 * en lugar de depender de un setTimeout arbitrario.
 */
export default function DocumentosImprimibles({
  documentos,
  autoPrint = true,
}: Props) {
  const [imgsReady, setImgsReady] = useState(false)
  const [pdfsReady, setPdfsReady] = useState(0)
  const imgsRef = useRef<HTMLImageElement[]>([])
  const printedRef = useRef(false)

  const pdfCount = documentos.filter((d) => esPDF(d.nombre_archivo)).length

  // Espera decode de imágenes nativas
  useEffect(() => {
    const imgs = imgsRef.current.filter(Boolean)
    if (imgs.length === 0) {
      setImgsReady(true)
      return
    }
    Promise.all(
      imgs.map((img) =>
        img.complete
          ? img.decode().catch(() => null)
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true })
              img.addEventListener('error', () => resolve(), { once: true })
            })
      )
    ).then(() => setImgsReady(true))
  }, [documentos])

  // Lanza print cuando TODO está listo
  useEffect(() => {
    if (!autoPrint || printedRef.current) return
    if (!imgsReady) return
    if (pdfsReady < pdfCount) return
    printedRef.current = true
    // Micro-delay para layout pintado
    const t = setTimeout(() => window.print(), 200)
    return () => clearTimeout(t)
  }, [autoPrint, imgsReady, pdfsReady, pdfCount])

  const onPdfReady = useCallback(() => {
    setPdfsReady((n) => n + 1)
  }, [])

  if (documentos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 print:hidden">
        <div className="text-center">
          <p className="text-lg font-medium">Sin documentos subidos</p>
          <p className="text-sm mt-1">
            Sube escaneos desde la página de la matrícula
          </p>
        </div>
      </div>
    )
  }

  const listo = imgsReady && pdfsReady >= pdfCount

  return (
    <>
      {!listo && (
        <div className="print:hidden fixed bottom-4 left-4 z-40 bg-white border border-gray-200 rounded-lg shadow px-3 py-2 flex items-center gap-2 text-xs text-gray-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          Preparando documentos para impresión…
        </div>
      )}

      {documentos.map((doc, idx) => (
        <div
          key={doc.id}
          className="px-8 py-6"
          style={{
            pageBreakBefore: idx === 0 ? 'auto' : 'always',
            breakBefore: idx === 0 ? 'auto' : 'page',
          }}
        >
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 print:mb-2">
            {doc.tipo.replace(/_/g, ' ')} · {doc.nombre_archivo}
          </p>

          {doc.signedUrl ? (
            esImagen(doc.nombre_archivo) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={(el) => {
                  if (el) imgsRef.current[idx] = el
                }}
                src={doc.signedUrl}
                alt={doc.nombre_archivo}
                className="w-full max-h-[85vh] object-contain print:max-h-none"
                style={{ maxHeight: '85vh' }}
              />
            ) : esPDF(doc.nombre_archivo) ? (
              <PdfRasterizer
                url={doc.signedUrl}
                nombre={doc.nombre_archivo}
                onReady={onPdfReady}
              />
            ) : (
              <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300 print:hidden">
                <a
                  href={doc.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Abrir {doc.nombre_archivo}
                </a>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-sm text-gray-400">
                No se pudo cargar el documento
              </p>
            </div>
          )}
        </div>
      ))}
    </>
  )
}
