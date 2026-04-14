import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import VistaSwitcher from '@/components/matriculas/VistaSwitcher'
import MatriculaFiltros from '@/components/matriculas/MatriculaFiltros'
import MatriculaPaginacion from '@/components/matriculas/MatriculaPaginacion'
import type { MatriculaConPersonas, TipoDocumento, DocResumen, Etapa } from '@/types'

const POR_PAGINA = 20

interface PageProps {
  searchParams: Promise<{
    etapa?: string | string[]
    desde?: string
    hasta?: string
    lleva_oposicion?: string
    lleva_traspaso?: string
    page?: string
  }>
}

export default async function MatriculasPage(props: PageProps) {
  const searchParams = await props.searchParams
  const supabase = await createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const pagina = Math.max(1, parseInt(searchParams.page ?? '1') || 1)
  const offset = (pagina - 1) * POR_PAGINA

  const etapasParam = searchParams.etapa
  const etapas: Etapa[] = etapasParam
    ? (Array.isArray(etapasParam) ? etapasParam : [etapasParam]) as Etapa[]
    : []

  const desde = searchParams.desde ?? null
  const hasta = searchParams.hasta ?? null
  const llevaOposicion = searchParams.lleva_oposicion ?? null
  const llevaTraspaso = searchParams.lleva_traspaso ?? null

  let query = schema
    .from('matriculas' as never)
    .select('*, personas(*)', { count: 'exact' } as never)
    .order('created_at' as never, { ascending: false })
    .range(offset, offset + POR_PAGINA - 1)

  if (etapas.length > 0) {
    query = query.in('etapa' as never, etapas as never)
  }
  if (desde) {
    query = query.gte('created_at' as never, desde as never)
  }
  if (hasta) {
    // include the full until day
    query = query.lte('created_at' as never, `${hasta}T23:59:59` as never)
  }
  if (llevaOposicion === 'true') {
    query = query.eq('lleva_oposicion' as never, true as never)
  } else if (llevaOposicion === 'false') {
    query = query.eq('lleva_oposicion' as never, false as never)
  }
  if (llevaTraspaso === 'true') {
    query = query.eq('lleva_traspaso' as never, true as never)
  } else if (llevaTraspaso === 'false') {
    query = query.eq('lleva_traspaso' as never, false as never)
  }

  const { data: mats, count } = await (query as unknown as Promise<{ data: unknown; count: number | null }>)

  const matriculas = (mats ?? []) as MatriculaConPersonas[]
  const total = count ?? 0

  const { data: docs } = await schema
    .from('documentos' as never)
    .select('matricula_id, tipo, storage_path, nombre_archivo')

  const documentosPorMatricula: Record<string, DocResumen[]> = {}
  for (const doc of (docs ?? []) as { matricula_id: string; tipo: TipoDocumento; storage_path: string; nombre_archivo: string }[]) {
    if (!documentosPorMatricula[doc.matricula_id]) {
      documentosPorMatricula[doc.matricula_id] = []
    }
    documentosPorMatricula[doc.matricula_id].push({
      tipo: doc.tipo,
      storage_path: doc.storage_path,
      nombre_archivo: doc.nombre_archivo,
    })
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Matrículas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gestión de todas las matrículas de vehículos financiados
            </p>
          </div>
          <Link href="/matriculas/nueva">
            <Button className="bg-nc-green hover:bg-nc-green-dark gap-2">
              <Plus className="h-4 w-4" />
              Nueva Matrícula
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-border rounded-lg p-4">
          <Suspense fallback={null}>
            <MatriculaFiltros />
          </Suspense>
        </div>

        <VistaSwitcher
          matriculas={matriculas}
          documentosPorMatricula={documentosPorMatricula}
          total={total}
        />

        {/* Paginación */}
        <Suspense fallback={null}>
          <MatriculaPaginacion
            total={total}
            pagina={pagina}
            porPagina={POR_PAGINA}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
