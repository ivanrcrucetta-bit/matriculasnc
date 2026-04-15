'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getSupabaseBrowser } from '@/lib/supabase'
import { subirDocumento } from '@/lib/actions'
import { procesarImagen, esImagen } from '@/lib/imagen-canvas'
import type { TipoDocumento } from '@/types'
import { TIPO_DOC_LABELS } from '@/types'

interface DocUploaderProps {
  matriculaId: string
  tipo: TipoDocumento
  onSuccess?: () => void
}

export default function DocUploader({ matriculaId, tipo, onSuccess }: DocUploaderProps) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Bug 3 fix: try-catch con feedback al usuario si falla el procesamiento
  const onDrop = useCallback(async (accepted: File[]) => {
    if (accepted.length === 0) return
    const raw = accepted[0]
    if (esImagen(raw)) {
      try {
        const optimizado = await procesarImagen(raw)
        setArchivo(optimizado)
      } catch {
        toast.error('No se pudo procesar la imagen. Intenta con otro archivo.')
      }
    } else {
      setArchivo(raw)
    }
  }, [])

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

  async function handleUpload() {
    if (!archivo) return
    setUploading(true)

    try {
      const supabase = getSupabaseBrowser()
      const ts = Date.now()
      const path = `${matriculaId}/${tipo}/${ts}_${archivo.name}`

      const { error } = await supabase.storage
        .from('matriculas-docs')
        .upload(path, archivo)

      if (error) throw new Error(error.message)

      await subirDocumento(matriculaId, tipo, {
        nombre_archivo: archivo.name,
        storage_path: path,
      })

      toast.success(`${TIPO_DOC_LABELS[tipo]} subido correctamente`)
      setArchivo(null)
      onSuccess?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {archivo ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-nc-green-light border border-nc-green text-sm">
          <FileText className="h-4 w-4 text-nc-green flex-shrink-0" />
          <span className="flex-1 truncate text-nc-green-dark">{archivo.name}</span>
          <button
            type="button"
            onClick={() => setArchivo(null)}
            className="text-muted-foreground hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-nc-green bg-nc-green-light'
              : 'border-gray-200 hover:border-nc-green hover:bg-nc-green-light/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Suelta aquí' : 'Arrastra o haz click para seleccionar'}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">PDF, JPG, PNG, WEBP — máx. 10MB</p>
        </div>
      )}

      {archivo && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-nc-green hover:bg-nc-green-dark"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            `Subir ${TIPO_DOC_LABELS[tipo]}`
          )}
        </Button>
      )}
    </div>
  )
}
