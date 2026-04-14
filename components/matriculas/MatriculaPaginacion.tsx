'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MatriculaPaginacionProps {
  total: number
  pagina: number
  porPagina: number
}

export default function MatriculaPaginacion({
  total,
  pagina,
  porPagina,
}: MatriculaPaginacionProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPaginas = Math.ceil(total / porPagina)
  const desde = (pagina - 1) * porPagina + 1
  const hasta = Math.min(pagina * porPagina, total)

  function irAPagina(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (total === 0) return null

  const paginas: number[] = []
  const rangoInicio = Math.max(1, pagina - 2)
  const rangoFin = Math.min(totalPaginas, pagina + 2)
  for (let i = rangoInicio; i <= rangoFin; i++) {
    paginas.push(i)
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-gray-900">{desde}–{hasta}</span> de{' '}
        <span className="font-medium text-gray-900">{total}</span> resultado{total !== 1 ? 's' : ''}
      </p>

      {totalPaginas > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => irAPagina(pagina - 1)}
            disabled={pagina === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {rangoInicio > 1 && (
            <>
              <Button
                variant={pagina === 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => irAPagina(1)}
                className={`h-8 w-8 p-0 text-xs ${pagina === 1 ? 'bg-nc-green hover:bg-nc-green-dark text-white' : ''}`}
              >
                1
              </Button>
              {rangoInicio > 2 && (
                <span className="text-muted-foreground text-sm px-1">…</span>
              )}
            </>
          )}

          {paginas.map((p) => (
            <Button
              key={p}
              variant={p === pagina ? 'default' : 'outline'}
              size="sm"
              onClick={() => irAPagina(p)}
              className={`h-8 w-8 p-0 text-xs ${p === pagina ? 'bg-nc-green hover:bg-nc-green-dark text-white' : ''}`}
            >
              {p}
            </Button>
          ))}

          {rangoFin < totalPaginas && (
            <>
              {rangoFin < totalPaginas - 1 && (
                <span className="text-muted-foreground text-sm px-1">…</span>
              )}
              <Button
                variant={pagina === totalPaginas ? 'default' : 'outline'}
                size="sm"
                onClick={() => irAPagina(totalPaginas)}
                className={`h-8 w-8 p-0 text-xs ${pagina === totalPaginas ? 'bg-nc-green hover:bg-nc-green-dark text-white' : ''}`}
              >
                {totalPaginas}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => irAPagina(pagina + 1)}
            disabled={pagina === totalPaginas}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
