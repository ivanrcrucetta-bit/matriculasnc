'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { recategorizarDocumento } from '@/lib/actions'
import { TIPO_DOC_LABELS } from '@/types'
import type { TipoDocumento } from '@/types'
import { TODOS_LOS_TIPOS } from '@/lib/documentos'
import { cn } from '@/lib/utils'

interface RecategorizarSelectProps {
  matriculaId: string
  documentoId: string
  tipoActual: TipoDocumento
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * Permite cambiar el tipo (clasificación) de un documento ya subido.
 * Sólo actualiza la columna `tipo` en la BD; el `storage_path` no se toca.
 */
export default function RecategorizarSelect({
  matriculaId,
  documentoId,
  tipoActual,
  variant = 'light',
  className,
}: RecategorizarSelectProps) {
  const [pending, startTransition] = useTransition()
  const [valor, setValor] = useState<TipoDocumento>(tipoActual)

  // Sincroniza el valor con la prop cuando cambia el documento o el tipo
  // desde fuera (p. ej. el DocViewer reutiliza la misma instancia al navegar
  // entre items, o el padre refresca los datos). Evitamos pisar una mutación
  // en vuelo para no deshacer un update optimista.
  useEffect(() => {
    if (pending) return
    setValor(tipoActual)
  }, [documentoId, tipoActual, pending])

  function handleChange(nuevo: TipoDocumento) {
    if (nuevo === valor || pending) return
    const anterior = valor
    setValor(nuevo)
    startTransition(async () => {
      try {
        await recategorizarDocumento(matriculaId, documentoId, nuevo)
        toast.success('Tipo actualizado')
      } catch {
        setValor(anterior)
        toast.error('No se pudo actualizar el tipo')
      }
    })
  }

  const esDark = variant === 'dark'

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <Select
        value={valor}
        onValueChange={(v) => handleChange(v as TipoDocumento)}
        disabled={pending}
      >
        <SelectTrigger
          title="Cambiar tipo"
          className={cn(
            'h-7 text-sm font-medium gap-1 px-2 py-0 w-auto max-w-full',
            esDark
              ? 'bg-transparent border-gray-700 text-white hover:bg-white/5 focus:ring-gray-500'
              : 'bg-transparent border-transparent text-gray-900 hover:bg-gray-100 hover:border-gray-200 focus:ring-nc-green/40'
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TODOS_LOS_TIPOS.map((t) => (
            <SelectItem key={t} value={t} className="text-sm">
              {TIPO_DOC_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && (
        <Loader2
          className={cn(
            'h-3.5 w-3.5 animate-spin',
            esDark ? 'text-gray-400' : 'text-muted-foreground'
          )}
        />
      )}
    </div>
  )
}
