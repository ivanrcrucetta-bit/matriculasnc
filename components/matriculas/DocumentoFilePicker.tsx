'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, RotateCcw, RotateCw, ZoomIn, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { procesarImagen, esImagen } from '@/lib/imagen-canvas'
import type { TipoDocumento } from '@/types'

interface DocumentoFilePickerProps {
  tipo: TipoDocumento
  label: string
  file: File | null
  onSelect: (f: File) => void
  onRemove: () => void
}

export default function DocumentoFilePicker({
  label,
  file,
  onSelect,
  onRemove,
}: DocumentoFilePickerProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Bug 2 fix: gestionar ObjectURL de imagen en un effect con cleanup
  useEffect(() => {
    if (!file || !esImagen(file)) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Bug 2 fix: gestionar ObjectURL de PDF en un effect con cleanup
  useEffect(() => {
    if (!file || file.type !== 'application/pdf') {
      setPdfUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Bug 1 fix: capturar errores de procesarImagen y notificar al usuario
  const procesarYSeleccionar = useCallback(
    async (raw: File, rotacion: 0 | 90 | 180 | 270 = 0) => {
      if (!esImagen(raw)) {
        onSelect(raw)
        return
      }
      setProcesando(true)
      try {
        const procesado = await procesarImagen(raw, { rotacion })
        onSelect(procesado)
      } catch {
        toast.error('No se pudo procesar la imagen. Intenta con otro archivo.')
      } finally {
        setProcesando(false)
      }
    },
    [onSelect]
  )

  // onDrop: async y awaita procesarYSeleccionar; resetea a delta 0 en archivo nuevo
  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted[0]) {
        await procesarYSeleccionar(accepted[0], 0)
      }
    },
    [procesarYSeleccionar]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  // Bug 1 fix: pasar solo el delta incremental (90° / 270°) sobre el file ya rotado,
  // en lugar de acumular un ángulo total en un ref y aplicarlo sobre el mismo file rotado.
  async function rotar(sentido: 'izq' | 'der') {
    if (!file || !esImagen(file)) return
    const delta = sentido === 'der' ? 90 : 270
    await procesarYSeleccionar(file, delta as 90 | 270)
  }

  const esPDF = file && file.type === 'application/pdf'

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      {procesando && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Optimizando imagen…
        </div>
      )}

      {!procesando && file ? (
        <div className="rounded-lg border border-nc-green bg-nc-green-light">
          <div className="flex items-center gap-3 p-3">
            {preview ? (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="flex-shrink-0 group relative"
                title="Ver imagen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={file.name}
                  className="w-12 h-12 object-cover rounded border border-nc-green/30 group-hover:opacity-80 transition-opacity"
                />
                <ZoomIn className="absolute inset-0 m-auto h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </button>
            ) : esPDF && pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center bg-red-50 rounded border border-red-200 flex-shrink-0 hover:bg-red-100 transition-colors"
                title="Ver PDF"
              >
                <FileText className="h-5 w-5 text-red-500" />
              </a>
            ) : null}

            <span className="flex-1 text-sm text-nc-green-dark truncate">{file.name}</span>

            {preview && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => rotar('izq')}
                  disabled={procesando}
                  title="Rotar izquierda"
                  className="p-1 rounded hover:bg-nc-green/20 text-nc-green-dark disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => rotar('der')}
                  disabled={procesando}
                  title="Rotar derecha"
                  className="p-1 rounded hover:bg-nc-green/20 text-nc-green-dark disabled:opacity-50"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onRemove}
              className="text-muted-foreground hover:text-red-500 flex-shrink-0 p-1"
              title="Quitar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : !procesando ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-nc-green bg-nc-green-light'
              : 'border-gray-200 hover:border-nc-green hover:bg-nc-green-light/40'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span className="text-sm">
              {isDragActive ? 'Suelta aquí' : 'Arrastra o haz click'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1">
            JPG, PNG, PDF — máx. 10MB · Las imágenes se optimizan automáticamente
          </p>
        </div>
      ) : null}

      {/* Dialog de previsualización */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="text-sm font-medium px-2 pt-1">{label}</DialogTitle>
          {preview && (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={file?.name}
                className="max-h-[70vh] max-w-full object-contain rounded"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => rotar('izq')}
                  disabled={procesando}
                >
                  <RotateCcw className="h-4 w-4 mr-1" /> Rotar izquierda
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => rotar('der')}
                  disabled={procesando}
                >
                  <RotateCw className="h-4 w-4 mr-1" /> Rotar derecha
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
