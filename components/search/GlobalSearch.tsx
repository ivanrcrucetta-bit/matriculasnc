'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, User, Search, Loader2 } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { ETAPA_INFO } from '@/types'
import type { SearchResultMatricula, SearchResultPersona } from '@/app/api/search/route'

interface GlobalSearchProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [matriculas, setMatriculas] = useState<SearchResultMatricula[]>([])
  const [personas, setPersonas] = useState<SearchResultPersona[]>([])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const buscar = useCallback((q: string) => {
    if (q.length < 2) {
      setMatriculas([])
      setPersonas([])
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          setMatriculas(data.matriculas ?? [])
          setPersonas(data.personas ?? [])
        }
      } catch {
        // ignore
      }
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => buscar(query), 200)
    return () => clearTimeout(timer)
  }, [query, buscar])

  function handleSelect(href: string) {
    onOpenChange?.(false)
    setQuery('')
    setMatriculas([])
    setPersonas([])
    router.push(href)
  }

  const sinResultados = matriculas.length === 0 && personas.length === 0 && query.length >= 2

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar placa, cédula, código NC, nombre, código cliente…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isPending && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isPending && sinResultados && (
          <CommandEmpty>Sin resultados para &ldquo;{query}&rdquo;</CommandEmpty>
        )}

        {!isPending && query.length < 2 && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Escribe al menos 2 caracteres</p>
            </div>
          </CommandEmpty>
        )}

        {matriculas.length > 0 && (
          <>
            <CommandGroup heading="Matrículas">
              {matriculas.map((m) => {
                const etapaInfo = ETAPA_INFO[m.etapa as keyof typeof ETAPA_INFO]
                return (
                  <CommandItem
                    key={m.id}
                    value={`matricula-${m.id}`}
                    onSelect={() => handleSelect(`/matriculas/${m.id}`)}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-nc-green-light flex-shrink-0">
                      <FileText className="h-4 w-4 text-nc-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{m.codigo}</span>
                        {m.placa && (
                          <span className="text-xs text-muted-foreground">· {m.placa}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {etapaInfo && (
                          <span className="text-xs text-muted-foreground">{etapaInfo.label}</span>
                        )}
                        {m.numero_credito && (
                          <span className="text-xs text-muted-foreground">· Cód. cliente: {m.numero_credito}</span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {personas.length > 0 && <CommandSeparator />}
          </>
        )}

        {personas.length > 0 && (
          <CommandGroup heading="Personas">
            {personas.map((p) => (
              <CommandItem
                key={`${p.id}-${p.matricula_id}`}
                value={`persona-${p.id}`}
                onSelect={() => handleSelect(`/matriculas/${p.matricula_id}`)}
                className="flex items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {p.nombre} {p.apellido}
                    </span>
                    {p.cedula && (
                      <span className="text-xs text-muted-foreground">· {p.cedula}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {p.rol} · {p.codigo}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
