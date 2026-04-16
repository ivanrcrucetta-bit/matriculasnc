'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { buscarDuplicados, type DuplicadoMatricula } from '@/lib/actions-docs'

interface Props {
  placa?: string
  chasis?: string
  numero_credito?: string
}

const CAMPO_LABEL: Record<string, string> = {
  placa: 'placa',
  chasis: 'chasis',
  numero_credito: 'código cliente',
}

/**
 * Busca matrículas con placa / chasis / código cliente coincidentes y avisa
 * al usuario antes de que cree una duplicada. La búsqueda se "debouncea"
 * 400ms para no spamear al servidor mientras se escribe.
 */
export default function DuplicadosAlert({
  placa,
  chasis,
  numero_credito,
}: Props) {
  const [duplicados, setDuplicados] = useState<DuplicadoMatricula[]>([])
  const [ignorado, setIgnorado] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)

    const tienAlgo =
      (placa && placa.trim().length >= 4) ||
      (chasis && chasis.trim().length >= 6) ||
      (numero_credito && numero_credito.trim().length >= 3)

    if (!tienAlgo) {
      setDuplicados([])
      return
    }

    timer.current = setTimeout(async () => {
      const res = await buscarDuplicados({ placa, chasis, numero_credito })
      setDuplicados(res)
    }, 400)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [placa, chasis, numero_credito])

  if (duplicados.length === 0 || ignorado) return null

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900">
            Ya existe{duplicados.length === 1 ? '' : 'n'} {duplicados.length}{' '}
            matrícula{duplicados.length === 1 ? '' : 's'} con datos parecidos
          </p>
          <ul className="mt-2 space-y-1">
            {duplicados.map((d) => (
              <li key={d.id} className="text-sm text-amber-900">
                <Link
                  href={`/matriculas/${d.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-medium underline hover:text-amber-700"
                >
                  {d.codigo}
                  <ExternalLink className="h-3 w-3" />
                </Link>{' '}
                <span className="text-amber-800">
                  ·{' '}
                  {d.coincide_por
                    .map((c) => `coincide en ${CAMPO_LABEL[c] ?? c}`)
                    .join(', ')}
                  {d.placa ? ` · placa ${d.placa}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setIgnorado(true)}
            className="mt-2 text-xs text-amber-800 underline hover:text-amber-900"
          >
            Crear de todas formas (ignorar aviso)
          </button>
        </div>
      </div>
    </div>
  )
}
