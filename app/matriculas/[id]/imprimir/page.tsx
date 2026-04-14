import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import PrintTrigger from './PrintTrigger'
import type { Matricula, Persona, Documento } from '@/types'

interface ImprimirPageProps {
  params: Promise<{ id: string }>
}

function esImagen(nombre: string) {
  return /\.(jpe?g|png|webp)$/i.test(nombre);
}

function esPDF(nombre: string) {
  return /\.pdf$/i.test(nombre);
}

export default async function ImprimirPage(props: ImprimirPageProps) {
  const params = await props.params;
  const supabase = createSupabaseServer()
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

  // Generar URLs firmadas (1h) en el servidor para cada documento
  const docsConUrl = await Promise.all(
    documentosList.map(async (doc) => {
      const { data } = await supabase.storage
        .from('matriculas-docs')
        .createSignedUrl(doc.storage_path, 3600)
      return { ...doc, signedUrl: data?.signedUrl ?? null }
    })
  )

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
      <PrintTrigger />
      {/* Botón flotante — oculto al imprimir */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          Imprimir
        </button>
        <a
          href={`/matriculas/${params.id}`}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        >
          ← Volver
        </a>
      </div>
      <div className="bg-white min-h-screen">
        {/* Encabezado — visible en pantalla y en impresión */}
        <div
          className="print:block px-8 pt-8 pb-4 border-b border-gray-200"
          style={{ pageBreakAfter: 'avoid' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {process.env.NEXT_PUBLIC_OFICINA_NOMBRE ?? 'NuevoCredito SRL'} · Documentos
              </p>
              <h1 className="text-xl font-bold font-mono text-gray-900">{matricula.codigo}</h1>
              {matricula.placa && (
                <p className="text-sm text-gray-600 mt-0.5">Placa: {matricula.placa}</p>
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

        {/* Sin documentos */}
        {docsConUrl.length === 0 && (
          <div className="flex items-center justify-center h-64 text-gray-400 print:hidden">
            <div className="text-center">
              <p className="text-lg font-medium">Sin documentos subidos</p>
              <p className="text-sm mt-1">
                Sube escaneos desde la página de la matrícula
              </p>
            </div>
          </div>
        )}

        {/* Documentos */}
        {docsConUrl.map((doc, idx) => (
          <div
            key={doc.id}
            className="px-8 py-6"
            style={{
              pageBreakBefore: idx === 0 ? 'auto' : 'always',
              breakBefore: idx === 0 ? 'auto' : 'page',
            }}
          >
            {/* Etiqueta del documento */}
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3 print:mb-2">
              {doc.tipo.replace(/_/g, ' ')} · {doc.nombre_archivo}
            </p>

            {doc.signedUrl ? (
              esImagen(doc.nombre_archivo) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                (<img
                  src={doc.signedUrl}
                  alt={doc.nombre_archivo}
                  className="w-full max-h-[85vh] object-contain"
                  style={{ maxHeight: '85vh' }}
                />)
              ) : esPDF(doc.nombre_archivo) ? (
                <iframe
                  src={doc.signedUrl}
                  title={doc.nombre_archivo}
                  className="w-full print:hidden"
                  style={{ height: '80vh', border: 'none' }}
                />
              ) : (
                <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300 print:hidden">
                  <a
                    href={doc.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    Abrir {doc.nombre_archivo}
                  </a>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-400">No se pudo cargar el documento</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
