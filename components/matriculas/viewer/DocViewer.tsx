'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { TIPO_DOC_LABELS } from '@/types'
import type { TipoDocumento } from '@/types'
import RecategorizarSelect from '../RecategorizarSelect'

export interface DocViewerItem {
  id: string
  nombre_archivo: string
  tipo: TipoDocumento
  signedUrl: string | null
  mime?: string
}

interface DocViewerProps {
  items: DocViewerItem[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
  matriculaId?: string
}

function esImagenNombre(n: string) {
  return /\.(jpe?g|png|webp|gif)$/i.test(n)
}

function esPDFNombre(n: string) {
  return /\.pdf$/i.test(n)
}

export default function DocViewer({
  items,
  initialIndex,
  open,
  onOpenChange,
  matriculaId,
}: DocViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const [rotate, setRotate] = useState(0)
  const [zoom, setZoom] = useState(1)

  const item = items[index]
  const total = items.length

  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  // Reset transforms al cambiar de item
  useEffect(() => {
    setRotate(0)
    setZoom(1)
  }, [index])

  // Prefetch adyacentes (i-1, i+1)
  useEffect(() => {
    if (!open) return
    const adyacentes = [items[index - 1], items[index + 1]].filter(
      (it): it is DocViewerItem =>
        !!it && !!it.signedUrl && esImagenNombre(it.nombre_archivo)
    )
    adyacentes.forEach((it) => {
      if (!it.signedUrl) return
      const img = new Image()
      img.src = it.signedUrl
    })
  }, [index, items, open])

  const prev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i))
  }, [])
  const next = useCallback(() => {
    setIndex((i) => (i < total - 1 ? i + 1 : i))
  }, [total])

  // Navegación por teclado
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'r' || e.key === 'R') setRotate((r) => (r + 90) % 360)
      else if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 4))
      else if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.5))
      else if (e.key === '0') {
        setZoom(1)
        setRotate(0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, prev, next])

  if (!item) return null

  const esImg = esImagenNombre(item.nombre_archivo)
  const esPdf = esPDFNombre(item.nombre_archivo)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] h-[92vh] p-0 overflow-hidden bg-gray-900 border-gray-800 text-white flex flex-col"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {TIPO_DOC_LABELS[item.tipo]}: {item.nombre_archivo}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Visor de documento. Usa las flechas para navegar, R para rotar, + y -
          para zoom, Esc para cerrar.
        </DialogDescription>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
          <div className="min-w-0 flex-1">
            {matriculaId ? (
              <RecategorizarSelect
                matriculaId={matriculaId}
                documentoId={item.id}
                tipoActual={item.tipo}
                variant="dark"
                className="-ml-2"
              />
            ) : (
              <p className="text-sm font-medium truncate">
                {TIPO_DOC_LABELS[item.tipo]}
              </p>
            )}
            <p className="text-xs text-gray-400 truncate">
              {item.nombre_archivo} · {index + 1} / {total}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {esImg && (
              <>
                <ToolbarBtn
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  title="Alejar (-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </ToolbarBtn>
                <span className="text-xs text-gray-400 px-1 tabular-nums w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <ToolbarBtn
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                  title="Acercar (+)"
                >
                  <ZoomIn className="h-4 w-4" />
                </ToolbarBtn>
                <span className="w-px h-5 bg-gray-700 mx-1" />
                <ToolbarBtn
                  onClick={() => setRotate((r) => (r + 270) % 360)}
                  title="Rotar izquierda"
                >
                  <RotateCcw className="h-4 w-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => setRotate((r) => (r + 90) % 360)}
                  title="Rotar derecha (R)"
                >
                  <RotateCw className="h-4 w-4" />
                </ToolbarBtn>
                <span className="w-px h-5 bg-gray-700 mx-1" />
              </>
            )}
            {item.signedUrl && (
              <>
                <ToolbarBtn asChild title="Descargar">
                  <a
                    href={item.signedUrl}
                    download={item.nombre_archivo}
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </ToolbarBtn>
                <ToolbarBtn asChild title="Abrir en nueva pestaña">
                  <a
                    href={item.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </ToolbarBtn>
              </>
            )}
            <span className="w-px h-5 bg-gray-700 mx-1" />
            <ToolbarBtn onClick={() => onOpenChange(false)} title="Cerrar (Esc)">
              <X className="h-4 w-4" />
            </ToolbarBtn>
          </div>
        </div>

        {/* Viewer */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          {/* Flechas */}
          {index > 0 && (
            <button
              type="button"
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {index < total - 1 && (
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {item.signedUrl ? (
            esImg ? (
              <ImagenPaneable
                src={item.signedUrl}
                alt={item.nombre_archivo}
                rotate={rotate}
                zoom={zoom}
              />
            ) : esPdf ? (
              <iframe
                src={item.signedUrl}
                title={item.nombre_archivo}
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="text-center text-gray-400">
                <FileText className="h-10 w-10 mx-auto mb-3" />
                <a
                  href={item.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline text-sm"
                >
                  Abrir {item.nombre_archivo}
                </a>
              </div>
            )
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          )}
        </div>

        {/* Strip de miniaturas */}
        {total > 1 && (
          <div className="flex-shrink-0 border-t border-gray-800 px-3 py-2 overflow-x-auto">
            <div className="flex gap-1.5 items-center">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'flex-shrink-0 rounded border transition-all',
                    i === index
                      ? 'border-nc-green ring-2 ring-nc-green/30'
                      : 'border-gray-700 hover:border-gray-500 opacity-70 hover:opacity-100'
                  )}
                >
                  {esImagenNombre(it.nombre_archivo) && it.signedUrl ? (
                    <StripThumb src={it.signedUrl} />
                  ) : (
                    <div className="w-12 h-12 bg-gray-800 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------

function ImagenPaneable({
  src,
  alt,
  rotate,
  zoom,
}: {
  src: string
  alt: string
  rotate: number
  zoom: number
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; active: boolean } | null>(null)

  // Reset pan al cambiar transformación
  useEffect(() => {
    setPos({ x: 0, y: 0 })
  }, [rotate, zoom, src])

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return
    dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y, active: true }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current?.active) return
    setPos({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y })
  }
  function onPointerUp() {
    if (dragRef.current) dragRef.current.active = false
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        'w-full h-full flex items-center justify-center overflow-hidden select-none',
        zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-full max-w-full object-contain transition-transform"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotate}deg) scale(${zoom})`,
        }}
      />
    </div>
  )
}

function StripThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (failed) {
    return (
      <div className="w-12 h-12 bg-gray-800 flex items-center justify-center">
        <FileText className="h-4 w-4 text-gray-500" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="w-12 h-12 object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function ToolbarBtn({
  children,
  onClick,
  title,
  asChild,
}: {
  children: React.ReactNode
  onClick?: () => void
  title?: string
  asChild?: boolean
}) {
  const className =
    'inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-800 transition-colors text-gray-200'
  if (asChild) {
    return (
      <span title={title} className={className}>
        {children}
      </span>
    )
  }
  return (
    <button type="button" onClick={onClick} title={title} className={className}>
      {children}
    </button>
  )
}
