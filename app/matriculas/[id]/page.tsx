import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PipelineIndicator from '@/components/matriculas/PipelineIndicator'
import BloqueosAlert from '@/components/matriculas/BloqueosAlert'
import DocGrid from '@/components/matriculas/DocGrid'
import HistorialTimeline from '@/components/matriculas/HistorialTimeline'
import PanelAcciones from '@/components/matriculas/PanelAcciones'
import EtapaBadge from '@/components/matriculas/EtapaBadge'
import { calcularBloqueos } from '@/lib/pipeline'
import { formatFecha } from '@/lib/fecha'
import type { Matricula, Persona, Documento, EventoHistorial } from '@/types'

interface DetallePageProps {
  params: Promise<{ id: string }>
}

export default async function MatriculaDetallePage(props: DetallePageProps) {
  const params = await props.params;
  const supabase = createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const [{ data: mat }, { data: personas }, { data: docs }, { data: hist }] = await Promise.all([
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
    schema
      .from('historial' as never)
      .select('*')
      .eq('matricula_id' as never, params.id)
      .order('created_at' as never, { ascending: false }),
  ])

  if (!mat) notFound()

  const matricula = mat as Matricula
  const personasList = (personas ?? []) as Persona[]
  const documentosList = (docs ?? []) as Documento[]
  const historialList = (hist ?? []) as EventoHistorial[]

  const comprador = personasList.find((p) => p.rol === 'comprador')
  const vendedor = personasList.find((p) => p.rol === 'vendedor')
  const bloqueos = calcularBloqueos(matricula, documentosList)

  return (
    <DashboardLayout>
      {/* Versión para pantalla */}
      <div className="print:hidden p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/" className="hover:underline">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/matriculas" className="hover:underline">
                Matrículas
              </Link>
              <span>/</span>
              <span className="font-mono">{matricula.codigo}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono text-gray-900">
                {matricula.codigo}
              </h1>
              {matricula.placa && (
                <span className="text-muted-foreground font-medium">
                  · {matricula.placa}
                </span>
              )}
              <EtapaBadge etapa={matricula.etapa} />
            </div>
            {matricula.marca && (
              <p className="text-sm text-muted-foreground mt-1">
                {matricula.marca} {matricula.modelo} {matricula.año} · {matricula.color}
              </p>
            )}
          </div>
          <Link href={`/matriculas/${params.id}/editar`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>

        {/* Contenido principal 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Columna izquierda (60%) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Pipeline */}
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Estado del proceso</h2>
              <PipelineIndicator matricula={matricula} />
            </div>

            {/* Bloqueos */}
            <BloqueosAlert bloqueos={bloqueos} matriculaId={params.id} />

            {/* Datos del vehículo */}
            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Vehículo</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {[
                  { label: 'Placa', value: matricula.placa },
                  { label: 'Chasis', value: matricula.chasis },
                  { label: 'Marca', value: matricula.marca },
                  { label: 'Modelo', value: matricula.modelo },
                  { label: 'Año', value: matricula.año?.toString() },
                  { label: 'Color', value: matricula.color },
                  { label: 'Número de Crédito', value: matricula.numero_credito },
                  { label: 'Fecha Oposición', value: formatFecha(matricula.fecha_oposicion) },
                  { label: 'Fecha Traspaso', value: formatFecha(matricula.fecha_traspaso) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-gray-900">{value ?? '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Personas */}
            {[comprador, vendedor].map((persona) =>
              persona ? (
                <div key={persona.id} className="bg-white border border-border rounded-lg p-6">
                  <h2 className="font-semibold text-gray-800 mb-4 capitalize">
                    {persona.rol === 'comprador' ? 'Cliente' : 'Vendedor'}
                  </h2>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {[
                      { label: 'Nombre', value: `${persona.nombre} ${persona.apellido}` },
                      { label: 'Cédula', value: persona.cedula },
                      { label: 'Teléfono', value: persona.telefono },
                      { label: 'Dirección', value: persona.direccion },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium text-gray-900 break-words">{value ?? '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null
            )}

            {/* Notas */}
            {matricula.notas && (
              <div className="bg-white border border-border rounded-lg p-6">
                <h2 className="font-semibold text-gray-800 mb-2">Notas</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{matricula.notas}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white border border-border rounded-lg p-6">
              <HistorialTimeline historial={historialList} />
            </div>
          </div>

          {/* Columna derecha (40%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Documentos */}
            <div className="bg-white border border-border rounded-lg p-6">
              <DocGrid matriculaId={params.id} documentos={documentosList} />
            </div>

            {/* Acciones */}
            <div className="bg-white border border-border rounded-lg p-6">
              <PanelAcciones matricula={matricula} documentos={documentosList} />
            </div>
          </div>
        </div>
      </div>

      {/* Versión impresa — Sobre */}
      <div className="hidden print:block">
        <div
          style={{
            width: '9.5in',
            height: '4.125in',
            border: '1px solid #ccc',
            position: 'relative',
            padding: '0.5in',
            fontFamily: 'serif',
            fontSize: '12pt',
          }}
        >
          {/* Remitente */}
          <div style={{ position: 'absolute', top: '0.5in', left: '0.5in' }}>
            <div style={{ fontWeight: 'bold' }}>
              {process.env.NEXT_PUBLIC_OFICINA_NOMBRE}
            </div>
            <div>{process.env.NEXT_PUBLIC_OFICINA_DIRECCION}</div>
            <div>{process.env.NEXT_PUBLIC_OFICINA_TELEFONO}</div>
          </div>

          {/* Destinatario */}
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
                {comprador.direccion && <div>{comprador.direccion}</div>}
                <div>República Dominicana</div>
              </>
            )}
            {(matricula.marca || matricula.modelo) && (
              <div style={{ marginTop: '0.12in', fontSize: '11pt', color: '#444' }}>
                {[matricula.marca, matricula.modelo, matricula.año?.toString(), matricula.color]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
          </div>

          {/* Referencia */}
          <div
            style={{
              position: 'absolute',
              bottom: '0.5in',
              left: '0.5in',
              right: '0.5in',
              fontSize: '10pt',
              color: '#555',
              borderTop: '1px solid #ccc',
              paddingTop: '0.2in',
            }}
          >
            Ref: {matricula.codigo}
            {matricula.placa ? ` | Placa: ${matricula.placa}` : ''}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
