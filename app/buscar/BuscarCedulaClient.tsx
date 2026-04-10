'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Loader2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import EtapaBadge from '@/components/matriculas/EtapaBadge'
import { getSupabaseBrowser } from '@/lib/supabase'
import type { Persona, Etapa } from '@/types'

interface ResultadoBusqueda {
  persona: Persona
  matricula: {
    id: string
    codigo: string
    placa: string | null
    etapa: Etapa
  }
}

export default function BuscarCedulaClient() {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [buscando, setBuscando] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = useCallback(async (cedula: string) => {
    if (cedula.length < 3) {
      setResultados([])
      setBuscado(false)
      return
    }

    setBuscando(true)
    const supabase = getSupabaseBrowser()

    const { data } = await supabase
      .schema('matriculas' as 'public')
      .from('personas' as never)
      .select('*, matriculas!inner(id, codigo, placa, etapa)')
      .ilike('cedula' as never, `%${cedula}%`)
      .limit(20)

    const rows = (data ?? []) as (Persona & {
      matriculas: { id: string; codigo: string; placa: string | null; etapa: Etapa }
    })[]

    setResultados(
      rows.map((r) => ({
        persona: r,
        matricula: r.matriculas,
      }))
    )
    setBuscado(true)
    setBuscando(false)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    buscar(val)
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Escribe al menos 3 dígitos de la cédula (ej. 001-000...)"
          value={query}
          onChange={handleChange}
          className="pl-10 h-12 text-base"
          autoFocus
        />
        {buscando && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Resultados */}
      {buscado && resultados.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p>No se encontraron personas con esa cédula</p>
        </div>
      )}

      {resultados.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
          </p>
          {resultados.map(({ persona, matricula }) => (
            <Link
              key={`${persona.id}-${matricula.id}`}
              href={`/matriculas/${matricula.id}`}
              className="block"
            >
              <div className="bg-white border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">
                        {persona.nombre} {persona.apellido}
                      </p>
                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                        {persona.rol}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                      {persona.cedula ?? '—'}
                    </p>
                    {persona.telefono && (
                      <p className="text-sm text-muted-foreground">{persona.telefono}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      {matricula.codigo}
                    </p>
                    {matricula.placa && (
                      <p className="text-xs text-muted-foreground">{matricula.placa}</p>
                    )}
                    <EtapaBadge etapa={matricula.etapa} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
