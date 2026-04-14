import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export interface SearchResultMatricula {
  type: 'matricula'
  id: string
  codigo: string
  placa: string | null
  etapa: string
  comprador: string | null
  numero_credito: string | null
}

export interface SearchResultPersona {
  type: 'persona'
  id: string
  matricula_id: string
  codigo: string
  nombre: string
  apellido: string
  cedula: string | null
  rol: string
  etapa: string
}

export type SearchResult = SearchResultMatricula | SearchResultPersona

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ matriculas: [], personas: [] })
  }

  const supabase = await createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')
  const like = `%${q}%`

  const [{ data: matsData }, { data: personasData }] = await Promise.all([
    schema
      .from('matriculas' as never)
      .select('id, codigo, placa, etapa, numero_credito')
      .or(
        `codigo.ilike.${like},placa.ilike.${like},numero_credito.ilike.${like}`
      )
      .limit(10),
    schema
      .from('personas' as never)
      .select('id, matricula_id, nombre, apellido, cedula, rol, matriculas!inner(codigo, etapa)')
      .or(`nombre.ilike.${like},apellido.ilike.${like},cedula.ilike.${like}`)
      .limit(10),
  ])

  const matriculas: SearchResultMatricula[] = (matsData ?? []).map((m: Record<string, unknown>) => ({
    type: 'matricula' as const,
    id: m.id as string,
    codigo: m.codigo as string,
    placa: m.placa as string | null,
    etapa: m.etapa as string,
    comprador: null,
    numero_credito: m.numero_credito as string | null,
  }))

  const personas: SearchResultPersona[] = (personasData ?? []).map((p: Record<string, unknown>) => {
    const mat = p.matriculas as Record<string, unknown> | null
    return {
      type: 'persona' as const,
      id: p.id as string,
      matricula_id: p.matricula_id as string,
      codigo: (mat?.codigo as string) ?? '',
      nombre: p.nombre as string,
      apellido: p.apellido as string,
      cedula: p.cedula as string | null,
      rol: p.rol as string,
      etapa: (mat?.etapa as string) ?? '',
    }
  })

  return NextResponse.json({ matriculas, personas })
}
