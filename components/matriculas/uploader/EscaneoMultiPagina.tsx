'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Camera,
  FileImage,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { procesarImagen } from '@/lib/imagen-canvas'
import { combinarImagenesAPdf } from '@/lib/pdf-combiner'
import { TIPO_DOC_LABELS } from '@/types'
import type { TipoDocumento } from '@/types'

export interface EscaneoMultiPaginaProps {
  tipo: TipoDocumento
  onPdfListo: (pdf: File, tipo: TipoDocumento) => void
  triggerLabel?: string
  triggerVariant?: 'default' | 'outline' | 'ghost'
  className?: string
}

interface PaginaCapturada {
  id: string
  file: File
  preview: string
}

/**
 * Flujo de escaneo multipágina: captura/importa varias imágenes,
 * las ordena, opcionalmente aplica auto-recorte y las combina en un
 * único PDF listo para subir.
 */
export default function EscaneoMultiPagina({
  tipo,
  onPdfListo,
  triggerLabel = 'Escanear multipágina',
  triggerVariant = 'outline',
  className,
}: EscaneoMultiPaginaProps) {
  const [open, setOpen] = useState(false)
  const [paginas, setPaginas] = useState<PaginaCapturada[]>([])
  const [procesando, setProcesando] = useState(false)
  const [autoRecorte, setAutoRecorte] = useState(true)
  const camaraRef = useRef<HTMLInputElement>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      paginas.forEach((p) => URL.revokeObjectURL(p.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const agregarFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      const nuevas: PaginaCapturada[] = files.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        preview: URL.createObjectURL(f),
      }))
      setPaginas((prev) => [...prev, ...nuevas])
    },
    []
  )

  function onCamara(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    void agregarFiles(files)
    e.target.value = ''
  }
  function onGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    void agregarFiles(files)
    e.target.value = ''
  }

  function eliminar(id: string) {
    setPaginas((prev) => {
      const p = prev.find((x) => x.id === id)
      if (p) URL.revokeObjectURL(p.preview)
      return prev.filter((x) => x.id !== id)
    })
  }

  function mover(id: string, dir: -1 | 1) {
    setPaginas((prev) => {
      const idx = prev.findIndex((p) => p.id === id)
      if (idx < 0) return prev
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const copia = [...prev]
      const [item] = copia.splice(idx, 1)
      copia.splice(target, 0, item)
      return copia
    })
  }

  async function combinar() {
    if (paginas.length === 0) return
    setProcesando(true)
    try {
      const optimizadas: File[] = []
      for (const p of paginas) {
        const f = await procesarImagen(p.file, {
          tipo,
          autoRecortar: autoRecorte,
          mejorarContraste: true,
        })
        optimizadas.push(f)
      }
      const fechaTag = new Date().toISOString().slice(0, 10)
      const pdf = await combinarImagenesAPdf(optimizadas, {
        nombre: `${tipo}-${fechaTag}`,
      })
      onPdfListo(pdf, tipo)
      toast.success(`PDF de ${optimizadas.length} página${optimizadas.length === 1 ? '' : 's'} listo`)
      paginas.forEach((p) => URL.revokeObjectURL(p.preview))
      setPaginas([])
      setOpen(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al combinar el PDF'
      toast.error(msg)
    } finally {
      setProcesando(false)
    }
  }

  function cerrar(next: boolean) {
    if (procesando) return
    setOpen(next)
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className={cn('h-8 gap-1 text-xs', className)}
      >
        <FileImage className="h-3.5 w-3.5" />
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={cerrar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Escáner multipágina</DialogTitle>
            <DialogDescription>
              Captura o importa varias páginas; se combinarán en un único PDF
              como{' '}
              <span className="font-medium">{TIPO_DOC_LABELS[tipo]}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => camaraRef.current?.click()}
                disabled={procesando}
              >
                <Camera className="h-3.5 w-3.5 mr-1" />
                Tomar foto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => galeriaRef.current?.click()}
                disabled={procesando}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Añadir desde galería
              </Button>
              <label className="inline-flex items-center gap-2 text-xs text-gray-700 ml-auto">
                <input
                  type="checkbox"
                  checked={autoRecorte}
                  onChange={(e) => setAutoRecorte(e.target.checked)}
                  disabled={procesando}
                  className="h-3.5 w-3.5"
                />
                Auto-recortar bordes
              </label>
              <input
                ref={camaraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onCamara}
                className="hidden"
              />
              <input
                ref={galeriaRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onGaleria}
                className="hidden"
              />
            </div>

            {paginas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-muted-foreground">
                Aún no hay páginas. Añade al menos una para crear el PDF.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {paginas.map((p, i) => (
                  <div
                    key={p.id}
                    className="relative rounded-lg border border-gray-200 bg-white overflow-hidden group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.preview}
                      alt={`Página ${i + 1}`}
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5">
                      {i + 1}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-1 py-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Subir"
                          onClick={() => mover(p.id, -1)}
                          className="p-1 rounded hover:bg-white/20 text-white"
                          disabled={i === 0 || procesando}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          title="Bajar"
                          onClick={() => mover(p.id, 1)}
                          className="p-1 rounded hover:bg-white/20 text-white"
                          disabled={i === paginas.length - 1 || procesando}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => eliminar(p.id)}
                        className="p-1 rounded hover:bg-red-500/60 text-white"
                        disabled={procesando}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => cerrar(false)}
              disabled={procesando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={combinar}
              disabled={procesando || paginas.length === 0}
              className="bg-nc-green hover:bg-nc-green-dark"
            >
              {procesando ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Combinando…
                </>
              ) : (
                `Combinar ${paginas.length} página${paginas.length === 1 ? '' : 's'} en PDF`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
