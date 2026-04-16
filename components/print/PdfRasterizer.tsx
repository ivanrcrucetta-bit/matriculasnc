'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Rasteriza un PDF a <img> para que la impresora SÍ imprima su contenido.
 * El <iframe> con viewer integrado no se imprime con window.print() en la
 * mayoría de navegadores; renderizar cada página como imagen soluciona eso.
 */
interface PdfRasterizerProps {
  url: string
  nombre: string
  maxWidthPx?: number
  onReady?: () => void
}

type PdfDocProxy = {
  numPages: number
  getPage: (n: number) => Promise<{
    getViewport: (opts: { scale: number }) => { width: number; height: number }
    render: (opts: {
      canvasContext: CanvasRenderingContext2D
      viewport: { width: number; height: number }
    }) => { promise: Promise<void> }
  }>
}

type PdfLib = {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (input: { url: string }) => { promise: Promise<PdfDocProxy> }
}

export default function PdfRasterizer({
  url,
  nombre,
  maxWidthPx = 1200,
  onReady,
}: PdfRasterizerProps) {
  const [pages, setPages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        // Import dinámico para no inflar el bundle principal.
        // La versión del worker DEBE coincidir con la del API.
        const pdfjs = (await import('pdfjs-dist')) as unknown as PdfLib & {
          version: string
        }
        const version = pdfjs.version ?? '4.10.38'
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`

        const doc = await pdfjs.getDocument({ url }).promise
        const urls: string[] = []
        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return
          const page = await doc.getPage(i)
          const viewport1 = page.getViewport({ scale: 1 })
          const scale = Math.min(2, maxWidthPx / viewport1.width)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          await page.render({ canvasContext: ctx, viewport }).promise
          urls.push(canvas.toDataURL('image/jpeg', 0.85))
        }
        if (!cancelled && mounted.current) {
          setPages(urls)
          onReady?.()
        }
      } catch (err) {
        if (!cancelled && mounted.current) {
          setError(err instanceof Error ? err.message : 'Error al rasterizar PDF')
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [url, maxWidthPx, onReady])

  if (error) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-red-500">No se pudo rasterizar: {error}</p>
      </div>
    )
  }

  if (!pages.length) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-sm text-gray-500">Preparando {nombre}…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 print:gap-0">
      {pages.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src}
          alt={`${nombre} — página ${i + 1}`}
          className="w-full max-h-[85vh] object-contain print:max-h-none"
          data-pdf-page={i + 1}
          style={
            i > 0
              ? { pageBreakBefore: 'always', breakBefore: 'page' }
              : undefined
          }
        />
      ))}
    </div>
  )
}
