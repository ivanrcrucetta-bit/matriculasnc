import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import MatriculaForm from '@/components/matriculas/MatriculaForm'
import type { Matricula, Persona } from '@/types'

interface EditarPageProps {
  params: Promise<{ id: string }>
}

export default async function EditarMatriculaPage(props: EditarPageProps) {
  const params = await props.params;
  const supabase = await createSupabaseServer()

  const { data: mat } = await supabase
    .schema('matriculas')
    .from('matriculas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!mat) notFound()

  const { data: personas } = await supabase
    .schema('matriculas')
    .from('personas')
    .select('*')
    .eq('matricula_id', params.id)

  const matricula = mat as Matricula
  const personasList = (personas ?? []) as Persona[]

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <a href={`/matriculas/${params.id}`} className="hover:underline">
              {matricula.codigo}
            </a>
            <span>/</span>
            <span>Editar</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Matrícula</h1>
        </div>
        <MatriculaForm
          matricula={matricula}
          personas={personasList}
          modo="editar"
        />
      </div>
    </DashboardLayout>
  )
}
