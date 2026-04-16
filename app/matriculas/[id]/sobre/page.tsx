import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import SobreAutoPrint from './SobreAutoPrint'
import type { Matricula, Persona } from '@/types'

interface SobrePageProps {
  params: Promise<{ id: string }>
}

export default async function SobrePage(props: SobrePageProps) {
  const { id } = await props.params
  const supabase = await createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const [{ data: mat }, { data: personas }] = await Promise.all([
    schema
      .from('matriculas' as never)
      .select('*')
      .eq('id' as never, id)
      .single(),
    schema.from('personas' as never).select('*').eq('matricula_id' as never, id),
  ])

  if (!mat) notFound()

  const matricula = mat as Matricula
  const personasList = (personas ?? []) as Persona[]
  const comprador = personasList.find((p) => p.rol === 'comprador')

  return (
    <>
      {/* @page y estilos específicos para impresión en sobre (9.4" x 4.4") */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: 9.4in 4.4in landscape; margin: 0; }
            html, body { margin: 0; padding: 0; background: white; }
            .sobre-controls { display: flex; }
            @media print {
              .sobre-controls { display: none !important; }
            }
          `,
        }}
      />

      <SobreAutoPrint />

      <div className="sobre-controls fixed top-4 right-4 z-50 gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow hover:bg-gray-700"
        >
          Imprimir sobre
        </button>
        <a
          href={`/matriculas/${id}`}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg shadow hover:bg-gray-50"
        >
          Volver
        </a>
      </div>

      <div
        style={{
          width: '9.4in',
          height: '4.4in',
          position: 'relative',
          padding: '0.5in',
          fontFamily: 'serif',
          fontSize: '12pt',
          boxSizing: 'border-box',
          backgroundColor: 'white',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '1.5in',
            left: '4in',
            textAlign: 'left',
          }}
        >
          {comprador && (
            <>
              <div style={{ fontWeight: 'bold', fontSize: '14pt' }}>
                {comprador.nombre} {comprador.apellido}
              </div>
              {matricula.numero_credito && (
                <div style={{ fontSize: '11pt', color: '#555' }}>
                  Cód. cliente: {matricula.numero_credito}
                </div>
              )}
            </>
          )}
          {(matricula.marca || matricula.modelo) && (
            <div
              style={{ marginTop: '0.12in', fontSize: '11pt', color: '#444' }}
            >
              {[
                matricula.marca,
                matricula.modelo,
                matricula.año?.toString(),
                matricula.color,
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          )}
          {matricula.placa && (
            <div style={{ marginTop: '0.06in', fontSize: '11pt', color: '#444' }}>
              Placa: {matricula.placa}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
