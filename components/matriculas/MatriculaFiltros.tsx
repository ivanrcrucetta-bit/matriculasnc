'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ETAPA_INFO, ETAPAS_ORDEN } from '@/types'
import type { Etapa } from '@/types'

const COLOR_CHIP: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 data-[active=true]:bg-gray-700 data-[active=true]:text-white data-[active=true]:border-gray-700',
  amber: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500',
  blue: 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600',
  orange: 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 data-[active=true]:bg-orange-500 data-[active=true]:text-white data-[active=true]:border-orange-500',
  green: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 data-[active=true]:bg-green-600 data-[active=true]:text-white data-[active=true]:border-green-600',
  teal: 'bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100 data-[active=true]:bg-teal-600 data-[active=true]:text-white data-[active=true]:border-teal-600',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600',
  slate: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 data-[active=true]:bg-slate-600 data-[active=true]:text-white data-[active=true]:border-slate-600',
}

export default function MatriculaFiltros() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const etapasActivas = searchParams.getAll('etapa') as Etapa[]
  const desde = searchParams.get('desde') ?? ''
  const hasta = searchParams.get('hasta') ?? ''
  const llevaOposicion = searchParams.get('lleva_oposicion') ?? ''
  const llevaTraspaso = searchParams.get('lleva_traspaso') ?? ''

  const hayFiltros =
    etapasActivas.length > 0 || desde || hasta || llevaOposicion || llevaTraspaso

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('page')

      for (const [key, value] of Object.entries(updates)) {
        params.delete(key)
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v))
        } else if (value !== null && value !== '') {
          params.set(key, value)
        }
      }

      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  function toggleEtapa(etapa: Etapa) {
    const nuevas = etapasActivas.includes(etapa)
      ? etapasActivas.filter((e) => e !== etapa)
      : [...etapasActivas, etapa]
    updateParams({ etapa: nuevas })
  }

  function toggleBool(key: string, current: string) {
    updateParams({ [key]: current === 'true' ? 'false' : current === 'false' ? null : 'true' })
  }

  function limpiarFiltros() {
    router.push(pathname)
  }

  return (
    <div className="space-y-3">
      {/* Chips de etapa */}
      <div className="flex flex-wrap gap-2">
        {ETAPAS_ORDEN.map((etapa) => {
          const info = ETAPA_INFO[etapa]
          const active = etapasActivas.includes(etapa)
          return (
            <button
              key={etapa}
              onClick={() => toggleEtapa(etapa)}
              data-active={active}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                COLOR_CHIP[info.color]
              )}
            >
              {info.label}
            </button>
          )
        })}
      </div>

      {/* Filtros de fecha y booleanos */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => updateParams({ desde: e.target.value })}
            className="h-7 px-2 text-xs border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-nc-green"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => updateParams({ hasta: e.target.value })}
            className="h-7 px-2 text-xs border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-nc-green"
          />
        </div>

        <button
          onClick={() => toggleBool('lleva_oposicion', llevaOposicion)}
          data-active={llevaOposicion === 'true'}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
            llevaOposicion === 'true'
              ? 'bg-orange-500 text-white border-orange-500'
              : llevaOposicion === 'false'
              ? 'bg-gray-200 text-gray-500 border-gray-200 line-through'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          )}
        >
          Con Oposición
        </button>

        <button
          onClick={() => toggleBool('lleva_traspaso', llevaTraspaso)}
          data-active={llevaTraspaso === 'true'}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
            llevaTraspaso === 'true'
              ? 'bg-teal-500 text-white border-teal-500'
              : llevaTraspaso === 'false'
              ? 'bg-gray-200 text-gray-500 border-gray-200 line-through'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          )}
        >
          Con Traspaso
        </button>

        {hayFiltros && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limpiarFiltros}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-red-600 gap-1"
          >
            <X className="h-3 w-3" />
            Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}
