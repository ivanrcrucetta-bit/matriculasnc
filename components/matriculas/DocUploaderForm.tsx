'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TipoDocumento } from '@/types'
import { TIPO_DOC_LABELS } from '@/types'

interface DocUploaderFormProps {
  tipo: TipoDocumento
  onFileSelected: (tipo: TipoDocumento, file: File | null) => void
  existeDoc?: boolean
}

export default function DocUploaderForm({
  tipo,
  onFileSelected,
  existeDoc,
}: DocUploaderFormProps) {
  const [archivo, setArchivo] = useState<File | null>(null)

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) {
        setArchivo(accepted[0])
        onFileSelected(tipo, accepted[0])
      }
    },
    [tipo, onFileSelected]
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

  function quitar() {
    setArchivo(null)
    onFileSelected(tipo, null)
  }

  if (existeDoc && !archivo) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>{TIPO_DOC_LABELS[tipo]} — ya subido</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-700">{TIPO_DOC_LABELS[tipo]}</p>
      {archivo ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-nc-green-light border border-nc-green text-sm">
          <FileText className="h-4 w-4 text-nc-green flex-shrink-0" />
          <span className="flex-1 truncate text-nc-green-dark">{archivo.name}</span>
          <button
            type="button"
            onClick={quitar}
            className="text-muted-foreground hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors text-sm',
            isDragActive
              ? 'border-nc-green bg-nc-green-light'
              : 'border-gray-200 hover:border-nc-green hover:bg-nc-green-light/50'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isDragActive ? 'Suelta aquí' : 'Arrastra o haz click'}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">PDF, JPG, PNG, WEBP — máx. 10MB</p>
        </div>
      )}
    </div>
  )
}
