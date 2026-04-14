'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { crearNota } from '@/lib/actions'
import { formatFechaHora } from '@/lib/fecha'
import type { Nota } from '@/types'

interface NotasThreadProps {
  matriculaId: string
  notas: Nota[]
}

export default function NotasThread({ matriculaId, notas }: NotasThreadProps) {
  const [contenido, setContenido] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contenido.trim()) return

    startTransition(async () => {
      try {
        await crearNota(matriculaId, contenido)
        setContenido('')
        toast.success('Nota agregada')
      } catch {
        toast.error('Error al guardar la nota')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-gray-800 text-sm">Notas internas</h3>
        {notas.length > 0 && (
          <span className="text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded-full">
            {notas.length}
          </span>
        )}
      </div>

      {/* Thread */}
      {notas.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Sin notas aún. Usa las notas para registrar llamadas, acuerdos verbales o indicaciones.
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {notas.map((nota) => (
            <div
              key={nota.id}
              className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1"
            >
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{nota.contenido}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{nota.autor_nombre ?? 'Sistema'}</span>
                <span>·</span>
                <span>{formatFechaHora(nota.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribe una nota interna..."
          rows={3}
          className="w-full text-sm px-3 py-2 border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-nc-green bg-white"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit(e as unknown as React.FormEvent)
            }
          }}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !contenido.trim()}
          className="bg-nc-green hover:bg-nc-green-dark gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          {isPending ? 'Guardando...' : 'Agregar nota'}
        </Button>
      </form>
    </div>
  )
}
