import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import PrintControls from './PrintControls'
import DocumentosImprimibles from './DocumentosImprimibles'
import type { Matricula, Persona, Documento } from '@/types'

interface ImprimirPageProps {
  params: Promise<{ id: string }>
}

export default async function ImprimirPage(props: ImprimirPageProps) {
  const params = await props.params
  const supabase = await createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const [{ data: mat }, { data: personas }, { data: docs }] = await Promise.all([
    schema
      .from('matriculas' as never)
      .select('*')
      .eq('id' as never, params.id)
      .single(),
    schema
      .from('personas' as never)
      .select('*')
      .eq('matricula_id' as never, params.id),
    schema
      .from('documentos' as never)
      .select('*')
      .eq('matricula_id' as never, params.id)
      .order('created_at' as never, { ascending: false }),
  ])

  if (!mat) notFound()

  const matricula = mat as Matricula
  const personasList = (personas ?? []) as Persona[]
  const documentosList = (docs ?? []) as Documento[]

  const cliente = personasList.find((p) => p.rol === 'comprador')

  // Firma todas las URLs en una sola ida y vuelta (batch)
  const storagePaths = documentosList.map((d) => d.storage_path)
  const { data: signedList } = await supabase.storage
    .from('matriculas-docs')
    .createSignedUrls(storagePaths, 3600)
  const signedMap: Record<string, string> = {}
  signedList?.forEach((r) => {
    if (r.signedUrl && r.path) signedMap[r.path] = r.signedUrl
  })

  const docsConUrl = documentosList.map((d) => ({
    id: d.id,
    tipo: d.tipo,
    nombre_archivo: d.nombre_archivo,
    signedUrl: signedMap[d.storage_path] ?? null,
  }))

  const vehiculoInfo = [
    matricula.marca,
    matricula.modelo,
    matricula.año?.toString(),
    matricula.color,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <PrintControls
        matriculaId={params.id}
        expedienteHref={`/api/matriculas/${params.id}/expediente`}
      />

      <div className="bg-white min-h-screen">
        {/* Encabezado */}
        <div
          className="print:block px-8 pt-8 pb-4 border-b border-gray-200"
          style={{ pageBreakAfter: 'avoid' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {process.env.NEXT_PUBLIC_OFICINA_NOMBRE ?? 'NuevoCredito SRL'} ·
                Documentos
              </p>
              <h1 className="text-xl font-bold font-mono text-gray-900">
                {matricula.codigo}
              </h1>
              {matricula.placa && (
                <p className="text-sm text-gray-600 mt-0.5">
                  Placa: {matricula.placa}
                </p>
              )}
            </div>
            <div className="text-right">
              {cliente && (
                <p className="text-base font-semibold text-gray-900">
                  {cliente.nombre} {cliente.apellido}
                </p>
              )}
              {vehiculoInfo && (
                <p className="text-sm text-gray-500 mt-0.5">{vehiculoInfo}</p>
              )}
            </div>
          </div>
        </div>

        <DocumentosImprimibles documentos={docsConUrl} autoPrint />
      </div>
    </>
  )
}
