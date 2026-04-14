'use client'

import { useState, useTransition } from 'react'
import { BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { snoozeAlerta } from '@/lib/actions'

interface SnoozeButtonProps {
  matriculaId: string
  tipoAlerta: string
}

export default function SnoozeButton({ matriculaId, tipoAlerta }: SnoozeButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleSnooze() {
    startTransition(async () => {
      try {
        await snoozeAlerta(matriculaId, tipoAlerta)
        setDone(true)
        toast.success('Alerta pospuesta 3 días')
      } catch {
        toast.error('Error al posponer alerta')
      }
    })
  }

  if (done) {
    return (
      <span className="text-xs text-muted-foreground italic">Pospuesta 3 días</span>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleSnooze}
      disabled={isPending}
      className="gap-1.5 text-muted-foreground hover:text-gray-700"
      title="Postergar 3 días"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <BellOff className="h-3.5 w-3.5" />
      )}
      <span className="hidden sm:inline">3 días</span>
    </Button>
  )
}
