import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import EtapaBadge from '@/components/matriculas/EtapaBadge'
import { Button } from '@/components/ui/button'
import type { Etapa } from '@/types'

interface Props {
  params: Promise<{ cedula: string }>
}

interface PersonaMatricula {
  id: string
  matricula_id: string
  nombre: string
  apellido: string
  cedula: string | null
  telefono: string | null
  direccion: string | null
  rol: string
  matriculas: {
    id: string
    codigo: string
    etapa: string
    placa: string | null
    marca: string | null
    modelo: string | null
    año: number | null
    created_at: string
  } | null
}

export default async function PersonaPerfilPage(props: Props) {
  const params = await props.params
  const cedula = decodeURIComponent(params.cedula)
  const supabase = await createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const { data: personasData } = await schema
    .from('personas' as never)
    .select('id, matricula_id, nombre, apellido, cedula, telefono, direccion, rol, matriculas!inner(id, codigo, etapa, placa, marca, modelo, año, created_at)')
    .eq('cedula' as never, cedula)
    .order('created_at' as never, { ascending: false })

  const personas = (personasData ?? []) as unknown as PersonaMatricula[]

  if (personas.length === 0) notFound()

  const primera = personas[0]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/personas" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Personas
          </Link>
          <span>/</span>
          <span>{primera.nombre} {primera.apellido}</span>
        </div>

        {/* Perfil */}
        <div className="bg-white border border-border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {primera.nombre} {primera.apellido}
              </h1>
              <dl className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Cédula</dt>
                  <dd className="font-medium font-mono">{primera.cedula ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Teléfono</dt>
                  <dd className="font-medium">{primera.telefono ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Dirección</dt>
                  <dd className="font-medium">{primera.direccion ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Matrículas</dt>
                  <dd className="font-medium">{personas.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Matrículas */}
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">
            Historial de matrículas
          </h2>
          <div className="space-y-3">
            {personas.map((p) => {
              const mat = p.matriculas
              if (!mat) return null
              return (
                <div
                  key={`${p.id}`}
                  className="bg-white border border-border rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {mat.codigo}
                      </span>
                      {mat.placa && (
                        <span className="text-sm text-muted-foreground">· {mat.placa}</span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.rol === 'comprador'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {p.rol === 'comprador' ? 'Cliente' : 'Vendedor'}
                      </span>
                    </div>
                    {(mat.marca || mat.modelo) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {[mat.marca, mat.modelo, mat.año?.toString()].filter(Boolean).join(' ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <EtapaBadge etapa={mat.etapa as Etapa} />
                    <Link href={`/matriculas/${mat.id}`}>
                      <Button size="sm" variant="outline">Ver</Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
