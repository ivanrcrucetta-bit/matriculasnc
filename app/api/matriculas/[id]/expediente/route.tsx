import { NextRequest } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import { createSupabaseServer } from '@/lib/supabase-server'
import { ExpedienteDocument } from '@/components/print/expediente-document'
import type {
  Matricula,
  Persona,
  Documento,
  EventoHistorial,
} from '@/types'

// @react-pdf depende de APIs de Node (Buffer/streams). Forzamos runtime Node.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Ctx {
  params: Promise<{ id: string }>
}

/**
 * Devuelve el expediente de la matrícula como application/pdf.
 * Genera el PDF en el servidor con @react-pdf/renderer, evitando que la
 * librería entre al bundle cliente.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params

  const supabase = await createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const [{ data: mat }, { data: personas }, { data: docs }, { data: hist }] =
    await Promise.all([
      schema
        .from('matriculas' as never)
        .select('*')
        .eq('id' as never, id)
        .single(),
      schema.from('personas' as never).select('*').eq('matricula_id' as never, id),
      schema
        .from('documentos' as never)
        .select('*')
        .eq('matricula_id' as never, id)
        .order('created_at' as never, { ascending: false }),
      schema
        .from('historial' as never)
        .select('*')
        .eq('matricula_id' as never, id)
        .order('created_at' as never, { ascending: false }),
    ])

  if (!mat) {
    return new Response('No encontrado', { status: 404 })
  }

  const matricula = mat as Matricula
  const personasList = (personas ?? []) as Persona[]
  const documentosList = (docs ?? []) as Documento[]
  const historialList = (hist ?? []) as EventoHistorial[]

  const oficinaNombre =
    process.env.NEXT_PUBLIC_OFICINA_NOMBRE ?? 'NuevoCredito SRL'

  const stream = await renderToStream(
    <ExpedienteDocument
      matricula={matricula}
      personas={personasList}
      documentos={documentosList}
      historial={historialList}
      oficinaNombre={oficinaNombre}
    />
  )

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="expediente-${matricula.codigo}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
