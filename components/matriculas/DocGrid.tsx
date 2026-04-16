'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Eye, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { eliminarDocumento } from '@/lib/actions'
import { firmarUrlsLote } from '@/lib/actions-docs'
import { formatFecha } from '@/lib/fecha'
import DocumentoUploader from './uploader/DocumentoUploader'
import DocViewer, { type DocViewerItem } from './viewer/DocViewer'
import { TIPO_DOC_LABELS } from '@/types'
import type { Documento, TipoDocumento } from '@/types'
import { TIPOS_REQUERIDOS } from '@/lib/documentos'

const DOCS_PRINCIPALES: TipoDocumento[] = TIPOS_REQUERIDOS

function esImagenNombre(nombre: string) {
  return /\.(jpe?g|png|webp)$/i.test(nombre)
}

/**
 * Grilla de documentos. Cambios clave respecto a la versión anterior:
 *  - Firma TODAS las URLs en un solo Server Action (batch).
 *  - Usa transformaciones de Supabase Storage para thumbnails (240x240, q70).
 *  - Abre un DocViewer global (lightbox) con navegación, zoom, rotación.
 *  - Integra el DocumentoUploader unificado en lugar de DocUploader por slot.
 */
export default function DocGrid({
  matriculaId,
  documentos,
}: {
  matriculaId: string
  documentos: Documento[]
}) {
  const docsMap = new Map(documentos.map((d) => [d.tipo, d]))
  const otrosDocs = documentos.filter((d) => !DOCS_PRINCIPALES.includes(d.tipo))

  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({})
  const [fullUrls, setFullUrls] = useState<Record<string, string>>({})
  const [loadingUrls, setLoadingUrls] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const paths = useMemo(() => documentos.map((d) => d.storage_path), [documentos])
  const pathsKey = paths.join('|')

  useEffect(() => {
    if (!paths.length) {
      setLoadingUrls(false)
      return
    }
    let cancelled = false
    setLoadingUrls(true)

    async function cargar() {
      // Thumbnails (solo imágenes) + URLs completas en paralelo
      const imgPaths = documentos
        .filter((d) => esImagenNombre(d.nombre_archivo))
        .map((d) => d.storage_path)

      const [full, thumbs] = await Promise.all([
        firmarUrlsLote(paths, { expiresIn: 3600 }),
        imgPaths.length
          ? firmarUrlsLote(imgPaths, {
              expiresIn: 3600,
              transform: {
                width: 240,
                height: 240,
                resize: 'cover',
                quality: 70,
              },
            })
          : Promise.resolve({ urls: {}, errores: [] }),
      ])

      if (cancelled) return
      setFullUrls(full.urls)
      setThumbUrls(thumbs.urls)
      setLoadingUrls(false)
    }

    cargar()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathsKey])

  const viewerItems: DocViewerItem[] = documentos.map((d) => ({
    id: d.id,
    nombre_archivo: d.nombre_archivo,
    tipo: d.tipo,
    signedUrl: fullUrls[d.storage_path] ?? null,
  }))

  function abrirVisor(docId: string) {
    const idx = documentos.findIndex((d) => d.id === docId)
    if (idx < 0) return
    setViewerIndex(idx)
    setViewerOpen(true)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 text-sm">Documentos</h3>

      <div className="grid grid-cols-1 gap-3">
        {DOCS_PRINCIPALES.map((tipo) => {
          const doc = docsMap.get(tipo)
          return doc ? (
            <DocCard
              key={tipo}
              doc={doc}
              matriculaId={matriculaId}
              thumb={thumbUrls[doc.storage_path] ?? fullUrls[doc.storage_path] ?? null}
              loading={loadingUrls}
              onVer={() => abrirVisor(doc.id)}
            />
          ) : (
            <DocSlotVacio key={tipo} tipo={tipo} />
          )
        })}

        {otrosDocs.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            matriculaId={matriculaId}
            thumb={thumbUrls[doc.storage_path] ?? fullUrls[doc.storage_path] ?? null}
            loading={loadingUrls}
            onVer={() => abrirVisor(doc.id)}
          />
        ))}
      </div>

      <div className="pt-2 space-y-2">
        <p className="text-xs text-muted-foreground">
          Agregar documentos — arrastra varios archivos; el tipo se detecta por
          el nombre y puedes corregirlo por cada archivo.
        </p>
        <DocumentoUploader matriculaId={matriculaId} dense />
      </div>

      <DocViewer
        items={viewerItems}
        initialIndex={viewerIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------

function DocCard({
  doc,
  matriculaId,
  thumb,
  loading,
  onVer,
}: {
  doc: Documento
  matriculaId: string
  thumb: string | null
  loading: boolean
  onVer: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const esImg = esImagenNombre(doc.nombre_archivo)

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
    <div className="border border-border rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-start gap-3">
        {esImg && thumb ? (
          <button
            type="button"
            onClick={onVer}
            className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt={doc.nombre_archivo}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={onVer}
            className="p-2 bg-nc-green-light rounded-lg flex-shrink-0 w-9 h-9 flex items-center justify-center hover:bg-nc-green-light/70 transition-colors"
          >
            <FileText className="h-5 w-5 text-nc-green" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {TIPO_DOC_LABELS[doc.tipo]}
          </p>
          <p
            className="text-xs text-muted-foreground truncate"
            title={doc.nombre_archivo}
          >
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
          onClick={onVer}
          disabled={loading}
          className="flex-1 gap-1"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
          Ver
        </Button>
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
  )
}

function DocSlotVacio({ tipo }: { tipo: TipoDocumento }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50/50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
          <FileText className="h-5 w-5 text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">
            {TIPO_DOC_LABELS[tipo]}
          </p>
          <p className="text-xs text-muted-foreground">No subido</p>
        </div>
      </div>
    </div>
  )
}
