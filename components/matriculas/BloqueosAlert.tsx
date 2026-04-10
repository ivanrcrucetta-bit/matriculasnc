import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BloqueosAlertProps {
  bloqueos: string[]
  matriculaId?: string
}

export default function BloqueosAlert({ bloqueos }: BloqueosAlertProps) {
  if (bloqueos.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs">✓</span>
        </div>
        <span>Sin bloqueos — el caso puede cerrarse cuando corresponda.</span>
      </div>
    )
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription>
        <p className="font-medium text-amber-800 mb-2">
          {bloqueos.length} {bloqueos.length === 1 ? 'bloqueo' : 'bloqueos'} para avanzar:
        </p>
        <ul className="space-y-1.5">
          {bloqueos.map((bloqueo, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              {bloqueo}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
