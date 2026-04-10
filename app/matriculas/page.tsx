import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import VistaSwitcher from '@/components/matriculas/VistaSwitcher'
import type { MatriculaConPersonas, TipoDocumento } from '@/types'

export default async function MatriculasPage() {
  const supabase = createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const { data: mats } = await schema
    .from('matriculas' as never)
    .select('*, personas(*)')
    .order('created_at' as never, { ascending: false })

  const matriculas = (mats ?? []) as MatriculaConPersonas[]

  const { data: docs } = await schema
    .from('documentos' as never)
    .select('matricula_id, tipo')

  const documentosPorMatricula: Record<string, TipoDocumento[]> = {}
  for (const doc of (docs ?? []) as { matricula_id: string; tipo: TipoDocumento }[]) {
    if (!documentosPorMatricula[doc.matricula_id]) {
      documentosPorMatricula[doc.matricula_id] = []
    }
    documentosPorMatricula[doc.matricula_id].push(doc.tipo)
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
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

        <VistaSwitcher
          matriculas={matriculas}
          documentosPorMatricula={documentosPorMatricula}
        />
      </div>
    </DashboardLayout>
  )
}
