'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Camera,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDocumentoUploader } from './useDocumentoUploader'
import { detectarTipoDocumento } from '@/lib/detectar-tipo-doc'
import { commitDocumentos } from '@/lib/actions-docs'
import { esImagen } from '@/lib/imagen-canvas'
import { TIPO_DOC_LABELS } from '@/types'
import type { TipoDocumento } from '@/types'
import type { UploadItem } from '@/lib/upload-queue'
import EscaneoMultiPagina from './EscaneoMultiPagina'

const TIPOS_DISPONIBLES: TipoDocumento[] = [
  'copia_matricula',
  'cedula_comprador',
  'cedula_vendedor',
  'contrato_venta',
  'fotocopia_matricula_vigente',
  'comprobante_dgii',
  'carta_credito',
  'certificado_deuda',
  'poder_notarial',
  'carta_no_objecion',
  'contrato_prenda',
  'otro',
]

export interface DocumentoUploaderProps {
  matriculaId: string | null
  tipoInicial?: TipoDocumento
  mostrarSelectorTipo?: boolean
  onAllDone?: () => void
  className?: string
  dense?: boolean
}

/**
 * Uploader unificado. Reemplaza DocUploader, DocUploaderForm y
 * DocumentoFilePicker con una sola pieza coherente:
 *  - multi-archivo con autodetección de tipo por nombre
 *  - progreso real por archivo (XHR)
 *  - reintentos automáticos + botón "Reintentar"
 *  - rotación inline para imágenes ya subidas (re-procesa y reemplaza)
 *  - commit atómico en servidor
 */
export default function DocumentoUploader({
  matriculaId,
  tipoInicial = 'otro',
  mostrarSelectorTipo = true,
  onAllDone,
  className,
  dense = false,
}: DocumentoUploaderProps) {
  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoDocumento>(tipoInicial)
  const [committing, setCommitting] = useState(false)
  const commitedRef = useRef<Set<string>>(new Set())
  const camaraInputRef = useRef<HTMLInputElement>(null)

  const {
    items,
    agregarArchivos,
    eliminar,
    reintentar,
    cancelar,
    cambiarTipo,
  } = useDocumentoUploader({
    matriculaId,
    onItemCompletado: async (item) => {
      if (!matriculaId) return
      if (commitedRef.current.has(item.id)) return
      commitedRef.current.add(item.id)
      try {
        setCommitting(true)
        const res = await commitDocumentos(matriculaId, [
          {
            tipo: item.tipo,
            nombre_archivo: item.nombreArchivo ?? item.file.name,
            storage_path: item.storagePath!,
            size: item.file.size,
            mime: item.file.type,
          },
        ])
        if (!res.ok) {
          toast.error(res.error ?? 'Error al registrar documento', {
            id: `commit-${item.id}`,
          })
        }
      } finally {
        setCommitting(false)
      }
    },
  })

  // Notificar cuando todos los uploads estén listos
  useEffect(() => {
    if (!onAllDone) return
    if (items.length === 0) return
    const todos = items.every((i) => i.status === 'done')
    if (todos) onAllDone()
  }, [items, onAllDone])

  const onDrop = useCallback(
    (aceptados: File[]) => {
      if (!aceptados.length) return
      // Si se arrastra 1 archivo: usa el tipo seleccionado (o autodetecta)
      // Si son varios: autodetecta cada uno, fallback al tipo seleccionado
      aceptados.forEach((f) => {
        const detectado = detectarTipoDocumento(f.name)
        const tipo = detectado ?? tipoSeleccionado
        agregarArchivos(tipo, [f])
      })
    },
    [agregarArchivos, tipoSeleccionado]
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
    multiple: true,
    noClick: items.length > 0,
  })

  function abrirCamara() {
    camaraInputRef.current?.click()
  }

  function onCamara(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const detectado = detectarTipoDocumento(files[0].name)
    agregarArchivos(detectado ?? tipoSeleccionado, files)
    e.target.value = ''
  }

  const hayProcesando = items.some(
    (i) => i.status === 'processing' || i.status === 'uploading' || i.status === 'pending'
  )
  const hayExitos = items.filter((i) => i.status === 'done').length
  const hayErrores = items.some((i) => i.status === 'error')

  return (
    <div className={cn('space-y-3', className)}>
      {/* Zona de drop */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer',
          dense ? 'p-4' : 'p-6',
          isDragActive
            ? 'border-nc-green bg-nc-green-light'
            : 'border-gray-200 hover:border-nc-green hover:bg-nc-green-light/40'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-gray-700">
          {isDragActive
            ? 'Suelta los archivos aquí'
            : 'Arrastra archivos o haz click para seleccionar'}
        </p>
        <p className="text-xs text-muted-foreground/80 mt-1">
          PDF, JPG, PNG, WEBP — máx. 10 MB · Se optimizan automáticamente
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          {mostrarSelectorTipo && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="inline-block"
            >
              <Select
                value={tipoSeleccionado}
                onValueChange={(v) => setTipoSeleccionado(v as TipoDocumento)}
              >
                <SelectTrigger className="h-8 text-xs w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DISPONIBLES.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {TIPO_DOC_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              abrirCamara()
            }}
            className="h-8 gap-1 text-xs"
          >
            <Camera className="h-3.5 w-3.5" />
            Tomar foto
          </Button>
          <div onClick={(e) => e.stopPropagation()} className="inline-block">
            <EscaneoMultiPagina
              tipo={tipoSeleccionado}
              onPdfListo={(pdf, tipo) => agregarArchivos(tipo, [pdf])}
            />
          </div>
        </div>
        <input
          ref={camaraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onCamara}
          className="hidden"
        />
      </div>

      {/* Lista de items */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              onEliminar={() => eliminar(it.id)}
              onReintentar={() => reintentar(it.id)}
              onCancelar={() => cancelar(it.id)}
              onCambiarTipo={(t) => cambiarTipo(it.id, t)}
            />
          ))}
        </div>
      )}

      {/* Resumen */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
          {hayProcesando && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Procesando…
            </span>
          )}
          {hayExitos > 0 && (
            <span className="flex items-center gap-1 text-nc-green-dark">
              <CheckCircle2 className="h-3 w-3" />
              {hayExitos} subido{hayExitos === 1 ? '' : 's'}
            </span>
          )}
          {hayErrores && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              Con errores
            </span>
          )}
          {committing && <span>Registrando…</span>}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function ItemRow({
  item,
  onEliminar,
  onReintentar,
  onCancelar,
  onCambiarTipo,
}: {
  item: UploadItem
  onEliminar: () => void
  onReintentar: () => void
  onCancelar: () => void
  onCambiarTipo: (t: TipoDocumento) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!esImagen(item.originalFile)) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(item.originalFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [item.originalFile])

  const esPDF = item.file.type === 'application/pdf'
  const statusColor =
    item.status === 'done'
      ? 'border-nc-green bg-nc-green-light'
      : item.status === 'error'
        ? 'border-red-200 bg-red-50'
        : 'border-gray-200 bg-white'

  const estadoTexto = useMemo(() => {
    switch (item.status) {
      case 'pending':
        return 'En cola'
      case 'processing':
        return 'Optimizando…'
      case 'uploading':
        return `Subiendo ${item.progress}%`
      case 'done':
        return 'Subido'
      case 'error':
        return item.error ?? 'Error'
      case 'cancelled':
        return 'Cancelado'
    }
  }, [item.status, item.progress, item.error])

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors',
        statusColor
      )}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={item.file.name}
          className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
        />
      ) : (
        <div
          className={cn(
            'w-10 h-10 rounded flex items-center justify-center flex-shrink-0',
            esPDF ? 'bg-red-50 border border-red-200' : 'bg-gray-100'
          )}
        >
          <FileText
            className={cn(
              'h-4 w-4',
              esPDF ? 'text-red-500' : 'text-gray-500'
            )}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 truncate">
            {item.file.name}
          </p>
          {item.status === 'done' && (
            <CheckCircle2 className="h-3.5 w-3.5 text-nc-green flex-shrink-0" />
          )}
          {item.status === 'error' && (
            <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <Select
            value={item.tipo}
            onValueChange={(v) => onCambiarTipo(v as TipoDocumento)}
            disabled={item.status === 'uploading' || item.status === 'done'}
          >
            <SelectTrigger className="h-6 text-xs w-48 px-2 py-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_DISPONIBLES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {TIPO_DOC_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span
            className={cn(
              'text-xs',
              item.status === 'error'
                ? 'text-red-600'
                : item.status === 'done'
                  ? 'text-nc-green-dark'
                  : 'text-muted-foreground'
            )}
          >
            {estadoTexto}
          </span>
        </div>

        {(item.status === 'uploading' || item.status === 'processing') && (
          <Progress value={item.progress} className="h-1 mt-1.5" />
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {item.status === 'error' && (
          <button
            type="button"
            onClick={onReintentar}
            title="Reintentar"
            className="p-1 rounded hover:bg-white text-red-600"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        {(item.status === 'uploading' || item.status === 'processing') && (
          <button
            type="button"
            onClick={onCancelar}
            title="Cancelar"
            className="p-1 rounded hover:bg-gray-100 text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {item.status !== 'uploading' && item.status !== 'processing' && (
          <button
            type="button"
            onClick={onEliminar}
            title="Eliminar"
            className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

