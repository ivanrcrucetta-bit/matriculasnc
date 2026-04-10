import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import StatsCards from '@/components/matriculas/StatsCards'
import AlertasPendientes from '@/components/matriculas/AlertasPendientes'
import VistaSwitcher from '@/components/matriculas/VistaSwitcher'
import type { MatriculaConPersonas, TipoDocumento } from '@/types'
import type { AlertaItem } from '@/components/matriculas/AlertasPendientes'
import { diasDesde } from '@/lib/fecha'

async function getDatos() {
  const supabase = createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  // Todas las matrículas con personas
  const { data: mats } = await schema
    .from('matriculas' as never)
    .select('*, personas(*)')
    .order('created_at' as never, { ascending: false })

  const matriculas = (mats ?? []) as MatriculaConPersonas[]

  // Tipos de documentos por matrícula
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
    const tipos = documentosPorMatricula[m.id] ?? []
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

  // Alertas
  const alertas: AlertaItem[] = []

  for (const m of matriculas) {
    if (m.etapa === 'cerrado') continue
    const comprador = m.personas?.find((p) => p.rol === 'comprador')
    const nombreComprador = comprador
      ? `${comprador.nombre} ${comprador.apellido}`
      : '—'

    const tipos = documentosPorMatricula[m.id] ?? []
    const diasSinDoc = diasDesde(m.created_at)

    if (
      m.etapa === 'registrada' &&
      tipos.length === 0 &&
      diasSinDoc > 3
    ) {
      alertas.push({
        id: m.id,
        codigo: m.codigo,
        placa: m.placa,
        comprador: nombreComprador,
        tipo: 'sin_docs',
        diasTranscurridos: diasSinDoc,
        updated_at: m.updated_at,
      })
    }

    const diasActual = diasDesde(m.updated_at)

    if (
      m.lleva_oposicion &&
      !m.fecha_oposicion &&
      ['docs_completos', 'oposicion_pendiente'].includes(m.etapa) &&
      diasActual > 5
    ) {
      alertas.push({
        id: m.id,
        codigo: m.codigo,
        placa: m.placa,
        comprador: nombreComprador,
        tipo: 'oposicion_pendiente',
        diasTranscurridos: diasActual,
        updated_at: m.updated_at,
      })
    }

    if (
      m.lleva_traspaso &&
      m.etapa === 'traspaso_en_proceso' &&
      m.fecha_traspaso &&
      diasDesde(m.fecha_traspaso) > 45
    ) {
      alertas.push({
        id: m.id,
        codigo: m.codigo,
        placa: m.placa,
        comprador: nombreComprador,
        tipo: 'traspaso_lento',
        diasTranscurridos: diasDesde(m.fecha_traspaso),
        updated_at: m.updated_at,
      })
    }

    if (diasActual > 15) {
      alertas.push({
        id: m.id,
        codigo: m.codigo,
        placa: m.placa,
        comprador: nombreComprador,
        tipo: 'sin_actividad',
        diasTranscurridos: diasActual,
        updated_at: m.updated_at,
      })
    }
  }

  // Deduplicar por id (priorizar la más crítica)
  const alertasUnicas = alertas.reduce<AlertaItem[]>((acc, a) => {
    const existe = acc.find((x) => x.id === a.id && x.tipo === a.tipo)
    if (!existe) acc.push(a)
    return acc
  }, [])

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
      <div className="p-8 space-y-8">
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
