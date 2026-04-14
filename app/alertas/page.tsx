import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ExportarResumen from './ExportarResumen'
import SnoozeButton from './SnoozeButton'
import { calcularAlertas, SEVERIDAD_INFO, type SnoozeRecord } from '@/lib/alertas'
import type { MatriculaConPersonas } from '@/types'

export default async function AlertasPage() {
  const supabase = await createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const [{ data: mats }, { data: docs }, { data: snoozeData }] = await Promise.all([
    schema
      .from('matriculas' as never)
      .select('*, personas(*)')
      .neq('etapa' as never, 'cerrado')
      .order('updated_at' as never, { ascending: true }),
    schema
      .from('documentos' as never)
      .select('matricula_id, tipo'),
    schema
      .from('alertas_snooze' as never)
      .select('matricula_id, tipo_alerta, snooze_until')
      .gt('snooze_until' as never, new Date().toISOString()),
  ])

  const matriculas = (mats ?? []) as MatriculaConPersonas[]
  const snoozes = (snoozeData ?? []) as SnoozeRecord[]

  const docsPorMat: Record<string, string[]> = {}
  for (const d of (docs ?? []) as { matricula_id: string; tipo: string }[]) {
    if (!docsPorMat[d.matricula_id]) docsPorMat[d.matricula_id] = []
    docsPorMat[d.matricula_id].push(d.tipo)
  }

  const alertas = calcularAlertas(matriculas, docsPorMat, snoozes)

  const criticas = alertas.filter((a) => a.severidad === 'critica')
  const medias = alertas.filter((a) => a.severidad === 'media')
  const bajas = alertas.filter((a) => a.severidad === 'baja')

  return (
    <DashboardLayout alertasCount={alertas.length}>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Matrículas que requieren atención · las silenciadas no aparecen por 3 días
            </p>
          </div>
          {alertas.length > 0 && <ExportarResumen alertas={alertas} />}
        </div>

        {/* Resumen de severidades */}
        {alertas.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Críticas', count: criticas.length, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
              { label: 'Medias', count: medias.length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
              { label: 'Bajas', count: bajas.length, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
            ].map(({ label, count, color, bg, border }) => (
              <div key={label} className={`${bg} border ${border} rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className={`text-xs font-medium ${color}`}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {alertas.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay alertas pendientes. ¡Todo al día!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map((a) => {
              const sev = SEVERIDAD_INFO[a.severidad]
              return (
                <div
                  key={a.id}
                  className={`flex items-center justify-between gap-4 p-4 bg-white border border-border rounded-lg border-l-4 ${
                    a.severidad === 'critica'
                      ? 'border-l-red-400'
                      : a.severidad === 'media'
                      ? 'border-l-amber-400'
                      : 'border-l-gray-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">{a.codigo}</span>
                      {a.placa && (
                        <span className="text-xs text-muted-foreground">· {a.placa}</span>
                      )}
                      <span className="text-xs text-muted-foreground">· {a.comprador}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-medium ${sev.bgColor} ${sev.textColor} border ${sev.borderColor} px-2 py-0.5 rounded-full`}
                      >
                        {sev.label}
                      </span>
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                        {a.tipo.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">{a.descripcion}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SnoozeButton matriculaId={a.matricula_id} tipoAlerta={a.tipo} />
                    <Link href={`/matriculas/${a.matricula_id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        Ver
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
