'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, FileText, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getSupabaseBrowser } from '@/lib/supabase'
import { TIPO_DOC_LABELS } from '@/types'
import type { DocResumen } from '@/types'

function esImagen(nombre: string) {
  return /\.(jpe?g|png|webp)$/i.test(nombre)
}

function esPDF(nombre: string) {
  return /\.pdf$/i.test(nombre)
}

interface DocPreviewBadgeProps {
  doc: DocResumen | undefined
  shortLabel: string
}

export default function DocPreviewBadge({ doc, shortLabel }: DocPreviewBadgeProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!dialogOpen || !doc) return
    if (signedUrl) return

    let cancelled = false
    setLoading(true)

    async function fetchUrl() {
      if (!doc) return
      try {
        const supabase = getSupabaseBrowser()
        const { data } = await supabase.storage
          .from('matriculas-docs')
          .createSignedUrl(doc.storage_path, 3600)
        if (!cancelled && data?.signedUrl) setSignedUrl(data.signedUrl)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchUrl()
    return () => { cancelled = true }
  }, [dialogOpen, doc, signedUrl])

  if (!doc) {
    return (
      <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">
        <XCircle className="h-3 w-3 flex-shrink-0" />
        {shortLabel}
      </span>
    )
  }

  const isImg = esImagen(doc.nombre_archivo)
  const isPdf = esPDF(doc.nombre_archivo)

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDialogOpen(true) }}
        className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
        title={`Ver ${TIPO_DOC_LABELS[doc.tipo]}`}
      >
        <CheckCircle className="h-3 w-3 flex-shrink-0" />
        {shortLabel}
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b">
            <DialogTitle className="text-sm font-medium">
              {TIPO_DOC_LABELS[doc.tipo]} · {doc.nombre_archivo}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[75vh]">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : signedUrl ? (
              isImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signedUrl}
                  alt={doc.nombre_archivo}
                  className="w-full object-contain"
                />
              ) : isPdf ? (
                <iframe
                  src={signedUrl}
                  title={doc.nombre_archivo}
                  className="w-full"
                  style={{ height: '70vh', border: 'none' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                  <FileText className="h-8 w-8" />
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
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No se pudo cargar el documento
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
