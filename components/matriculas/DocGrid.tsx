'use client'

import { useState, useEffect } from 'react'
import { FileText, Eye, Trash2, Upload, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getSupabaseBrowser } from '@/lib/supabase'
import { eliminarDocumento } from '@/lib/actions'
import { formatFecha } from '@/lib/fecha'
import DocUploader from './DocUploader'
import { TIPO_DOC_LABELS } from '@/types'
import type { Documento, TipoDocumento } from '@/types'
import { TIPOS_REQUERIDOS, TIPOS_ADICIONALES, TIPO_DOCUMENTO_INFO } from '@/lib/documentos'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DOCS_PRINCIPALES: TipoDocumento[] = TIPOS_REQUERIDOS

function esImagen(nombre: string) {
  return /\.(jpe?g|png|webp)$/i.test(nombre)
}

function esPDF(nombre: string) {
  return /\.pdf$/i.test(nombre)
}

function DocCard({
  doc,
  matriculaId,
}: {
  doc: Documento
  matriculaId: string
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const esImg = esImagen(doc.nombre_archivo)
  const esPdf = esPDF(doc.nombre_archivo)

  // Load signed URL lazily on mount for thumbnail preview
  useEffect(() => {
    let cancelled = false
    async function loadUrl() {
      setLoadingUrl(true)
      try {
        const supabase = getSupabaseBrowser()
        const { data } = await supabase.storage
          .from('matriculas-docs')
          .createSignedUrl(doc.storage_path, 3600)
        if (!cancelled && data?.signedUrl) setSignedUrl(data.signedUrl)
      } finally {
        if (!cancelled) setLoadingUrl(false)
      }
    }
    loadUrl()
    return () => { cancelled = true }
  }, [doc.storage_path])

  async function handleEliminar() {
    if (!confirm('¿Eliminar este documento?')) return
    setDeleting(true)
    try {
      await eliminarDocumento(matriculaId, doc.id, doc.storage_path)
      toast.success('Documento eliminado')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="border border-border rounded-lg p-4 bg-white space-y-3">
        <div className="flex items-start gap-3">
          {/* Thumbnail para imágenes */}
          {esImg && signedUrl ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={doc.nombre_archivo}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <div className="p-2 bg-nc-green-light rounded-lg flex-shrink-0 w-9 h-9 flex items-center justify-center">
              <FileText className="h-5 w-5 text-nc-green" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {TIPO_DOC_LABELS[doc.tipo]}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={doc.nombre_archivo}>
              {doc.nombre_archivo}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatFecha(doc.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            disabled={loadingUrl || !signedUrl}
            className="flex-1 gap-1"
          >
            {loadingUrl ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            Ver
          </Button>
          {signedUrl && (
            <Button
              size="sm"
              variant="outline"
              asChild
              className="gap-1"
            >
              <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEliminar}
            disabled={deleting}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            {deleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Dialog de vista previa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b">
            <DialogTitle className="text-sm font-medium">
              {TIPO_DOC_LABELS[doc.tipo]} · {doc.nombre_archivo}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[75vh]">
            {signedUrl ? (
              esImg ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={signedUrl}
                  alt={doc.nombre_archivo}
                  className="w-full object-contain"
                />
              ) : esPdf ? (
                <iframe
                  src={signedUrl}
                  title={doc.nombre_archivo}
                  className="w-full"
                  style={{ height: '70vh', border: 'none' }}
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    Abrir archivo
                  </a>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DocSlotVacio({
  tipo,
  matriculaId,
}: {
  tipo: TipoDocumento
  matriculaId: string
}) {
  const [showUpload, setShowUpload] = useState(false)

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
          <FileText className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{TIPO_DOC_LABELS[tipo]}</p>
          <p className="text-xs text-muted-foreground">No subido</p>
        </div>
      </div>
      {showUpload ? (
        <DocUploader
          matriculaId={matriculaId}
          tipo={tipo}
          onSuccess={() => setShowUpload(false)}
        />
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowUpload(true)}
          className="w-full gap-1 text-nc-green border-nc-green/30 hover:bg-nc-green-light"
        >
          <Upload className="h-3 w-3" />
          Subir
        </Button>
      )}
    </div>
  )
}

export default function DocGrid({ matriculaId, documentos }: { matriculaId: string; documentos: Documento[] }) {
  const docsMap = new Map(documentos.map((d) => [d.tipo, d]))

  const otrosDocs = documentos.filter(
    (d) => !DOCS_PRINCIPALES.includes(d.tipo)
  )

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 text-sm">Documentos</h3>

      <div className="grid grid-cols-1 gap-3">
        {DOCS_PRINCIPALES.map((tipo) => {
          const doc = docsMap.get(tipo)
          return doc ? (
            <DocCard key={tipo} doc={doc} matriculaId={matriculaId} />
          ) : (
            <DocSlotVacio key={tipo} tipo={tipo} matriculaId={matriculaId} />
          )
        })}

        {/* Documentos adicionales */}
        {otrosDocs.map((doc) => (
          <DocCard key={doc.id} doc={doc} matriculaId={matriculaId} />
        ))}
      </div>

      {/* Upload de documentos adicionales */}
      <AgregarDocumentoAdicional matriculaId={matriculaId} tiposExistentes={documentos.map(d => d.tipo)} />
    </div>
  )
}

function AgregarDocumentoAdicional({
  matriculaId,
  tiposExistentes,
}: {
  matriculaId: string
  tiposExistentes: TipoDocumento[]
}) {
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoDocumento>('otro')
  const [mostrarUploader, setMostrarUploader] = useState(false)

  const tiposDisponibles = TIPOS_ADICIONALES.filter(
    (t) => !tiposExistentes.includes(t) || t === 'otro'
  )

  return (
    <div className="pt-2 space-y-2">
      <p className="text-xs text-muted-foreground">Agregar documento adicional</p>
      <Select
        value={tipoSeleccionado}
        onValueChange={(v) => {
          setTipoSeleccionado(v as TipoDocumento)
          setMostrarUploader(false)
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {tiposDisponibles.map((tipo) => (
            <SelectItem key={tipo} value={tipo} className="text-xs">
              <span className={`mr-1.5 text-xs font-medium ${TIPO_DOCUMENTO_INFO[tipo].textColor}`}>
                ●
              </span>
              {TIPO_DOC_LABELS[tipo]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {mostrarUploader ? (
        <DocUploader
          matriculaId={matriculaId}
          tipo={tipoSeleccionado}
          onSuccess={() => setMostrarUploader(false)}
        />
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setMostrarUploader(true)}
          className="w-full gap-1 text-nc-green border-nc-green/30 hover:bg-nc-green-light"
        >
          <Upload className="h-3 w-3" />
          Subir {TIPO_DOC_LABELS[tipoSeleccionado]}
        </Button>
      )}
    </div>
  )
}
