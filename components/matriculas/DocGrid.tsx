'use client'

import { useState } from 'react'
import { FileText, Eye, Trash2, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getSupabaseBrowser } from '@/lib/supabase'
import { eliminarDocumento } from '@/lib/actions'
import { formatFecha } from '@/lib/fecha'
import DocUploader from './DocUploader'
import { TIPO_DOC_LABELS } from '@/types'
import type { Documento, TipoDocumento } from '@/types'

const DOCS_PRINCIPALES: TipoDocumento[] = [
  'copia_matricula',
  'cedula_comprador',
  'cedula_vendedor',
]

interface DocGridProps {
  matriculaId: string
  documentos: Documento[]
}

function DocCard({
  doc,
  matriculaId,
}: {
  doc: Documento
  matriculaId: string
}) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleVer() {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data, error } = await supabase.storage
        .from('matriculas-docs')
        .createSignedUrl(doc.storage_path, 3600)

      if (error || !data?.signedUrl) throw new Error('No se pudo generar el enlace')
      window.open(data.signedUrl, '_blank')
    } catch {
      toast.error('Error al abrir el documento')
    } finally {
      setLoading(false)
    }
  }

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
        <div className="p-2 bg-nc-green-light rounded-lg flex-shrink-0">
          <FileText className="h-5 w-5 text-nc-green" />
        </div>
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
          onClick={handleVer}
          disabled={loading}
          className="flex-1 gap-1"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
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

export default function DocGrid({ matriculaId, documentos }: DocGridProps) {
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
      <div className="pt-2">
        <p className="text-xs text-muted-foreground mb-2">Documentos adicionales</p>
        <DocUploader matriculaId={matriculaId} tipo="otro" />
      </div>
    </div>
  )
}
