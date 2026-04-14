import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatsCards from '@/components/matriculas/StatsCards'
import AlertasPendientes from '@/components/matriculas/AlertasPendientes'
import VistaSwitcher from '@/components/matriculas/VistaSwitcher'
import type { MatriculaConPersonas, TipoDocumento, DocResumen } from '@/types'
import type { AlertaItem } from '@/components/matriculas/AlertasPendientes'
import { diasDesde } from '@/lib/fecha'
import { calcularAlertas, type SnoozeRecord } from '@/lib/alertas'

async function getDatos() {
  const supabase = await createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  // Todas las matrículas con personas
  const { data: mats } = await schema
    .from('matriculas' as never)
    .select('*, personas(*)')
    .order('created_at' as never, { ascending: false })

  const matriculas = (mats ?? []) as MatriculaConPersonas[]

  // Documentos por matrícula (con datos para previsualización)
  const { data: docs } = await schema
    .from('documentos' as never)
    .select('matricula_id, tipo, storage_path, nombre_archivo')

  const { data: snoozeData } = await schema
    .from('alertas_snooze' as never)
    .select('matricula_id, tipo_alerta, snooze_until')
    .gt('snooze_until' as never, new Date().toISOString())

  const snoozes = (snoozeData ?? []) as SnoozeRecord[]

  const documentosPorMatricula: Record<string, DocResumen[]> = {}
  const docsPorMat: Record<string, string[]> = {}
  for (const doc of (docs ?? []) as { matricula_id: string; tipo: TipoDocumento; storage_path: string; nombre_archivo: string }[]) {
    if (!documentosPorMatricula[doc.matricula_id]) {
      documentosPorMatricula[doc.matricula_id] = []
    }
    documentosPorMatricula[doc.matricula_id].push({
      tipo: doc.tipo,
      storage_path: doc.storage_path,
      nombre_archivo: doc.nombre_archivo,
    })
    if (!docsPorMat[doc.matricula_id]) docsPorMat[doc.matricula_id] = []
    docsPorMat[doc.matricula_id].push(doc.tipo)
  }

  // Stats
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const activas = matriculas.filter((m) => m.etapa !== 'cerrado').length

  const oposicionPendiente = matriculas.filter(
    (m) =>
      m.lleva_oposicion &&
      !m.fecha_oposicion &&
      m.etapa !== 'cerrado'
  ).length

  const docsFaltantes = matriculas.filter((m) => {
    if (m.etapa === 'cerrado') return false
    const docs = documentosPorMatricula[m.id] ?? []
    const tipos = docs.map((d) => d.tipo)
    return (
      !tipos.includes('copia_matricula') ||
      !tipos.includes('cedula_comprador') ||
      !tipos.includes('cedula_vendedor')
    )
  }).length

  const traspasosEnProceso = matriculas.filter(
    (m) => m.etapa === 'traspaso_en_proceso'
  ).length

  const cerradasEsteMes = matriculas.filter(
    (m) =>
      m.etapa === 'cerrado' &&
      new Date(m.updated_at) >= inicioMes
  ).length

  const sinActividadMas15 = matriculas.filter(
    (m) => m.etapa !== 'cerrado' && diasDesde(m.updated_at) > 15
  ).length

  // Alertas usando helper compartido
  const alertasSeveridad = calcularAlertas(matriculas, docsPorMat, snoozes)

  const alertasUnicas: AlertaItem[] = alertasSeveridad.map((a) => ({
    id: a.matricula_id,
    codigo: a.codigo,
    placa: a.placa,
    comprador: a.comprador,
    tipo: a.tipo,
    diasTranscurridos: a.diasTranscurridos,
    updated_at: a.updated_at,
  }))

  return {
    matriculas,
    documentosPorMatricula,
    stats: {
      activas,
      oposicionPendiente,
      docsFaltantes,
      traspasosEnProceso,
      cerradasEsteMes,
      sinActividadMas15,
    },
    alertas: alertasUnicas,
  }
}

export default async function DashboardPage() {
  const { matriculas, documentosPorMatricula, stats, alertas } = await getDatos()

  return (
    <DashboardLayout alertasCount={alertas.length}>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Resumen general de matrículas
            </p>
          </div>
          <Link href="/matriculas/nueva">
            <Button className="bg-nc-green hover:bg-nc-green-dark gap-2">
              <Plus className="h-4 w-4" />
              Nueva Matrícula
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Alertas */}
        {alertas.length > 0 && <AlertasPendientes alertas={alertas} />}

        {/* Vista principal */}
        <VistaSwitcher
          matriculas={matriculas}
          documentosPorMatricula={documentosPorMatricula}
        />
      </div>
    </DashboardLayout>
  )
}
