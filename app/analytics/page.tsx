import { BarChart3 } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { MatriculasPorMesChart, DistribucionEtapaChart } from '@/components/analytics/AnalyticsCharts'
import { ETAPA_INFO, ETAPAS_ORDEN } from '@/types'
import { format, subMonths, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface MatriculaRaw {
  id: string
  etapa: string
  created_at: string
  updated_at: string
}

export default async function AnalyticsPage() {
  const supabase = createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const { data: matsData } = await schema
    .from('matriculas' as never)
    .select('id, etapa, created_at, updated_at')
    .order('created_at' as never, { ascending: false })

  const matriculas = (matsData ?? []) as MatriculaRaw[]

  // Matrículas por mes (últimos 12 meses)
  const ahora = new Date()
  const meses: Array<{ mes: string; count: number }> = []
  for (let i = 11; i >= 0; i--) {
    const inicio = startOfMonth(subMonths(ahora, i))
    const fin = startOfMonth(subMonths(ahora, i - 1))
    const count = matriculas.filter((m) => {
      const d = new Date(m.created_at)
      return d >= inicio && d < fin
    }).length
    meses.push({
      mes: format(inicio, 'MMM yy', { locale: es }),
      count,
    })
  }

  // Distribución por etapa (activas)
  const distribucion = ETAPAS_ORDEN.map((etapa) => ({
    etapa,
    label: ETAPA_INFO[etapa].label,
    count: matriculas.filter((m) => m.etapa === etapa).length,
    color: ETAPA_INFO[etapa].color,
  })).filter((d) => d.count > 0)

  // Tiempo promedio de cierre (en días)
  const cerradas = matriculas.filter((m) => m.etapa === 'cerrado')
  const promediosCierre =
    cerradas.length > 0
      ? cerradas.reduce((sum, m) => {
          const dias =
            (new Date(m.updated_at).getTime() - new Date(m.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
          return sum + dias
        }, 0) / cerradas.length
      : null

  // Tasa de traspaso (completado / total activas que llevan traspaso)
  const activas = matriculas.filter((m) => m.etapa !== 'cerrado').length
  const enTraspaso = matriculas.filter((m) => m.etapa === 'traspaso_en_proceso').length
  const traspasoCompletado = matriculas.filter(
    (m) => m.etapa === 'traspaso_completado'
  ).length

  const stats = [
    {
      label: 'Total matrículas',
      value: matriculas.length,
      sub: `${activas} activas`,
    },
    {
      label: 'Tiempo prom. cierre',
      value: promediosCierre !== null ? `${Math.round(promediosCierre)}d` : '—',
      sub: `${cerradas.length} casos cerrados`,
    },
    {
      label: 'Traspasos activos',
      value: enTraspaso,
      sub: `${traspasoCompletado} completados`,
    },
    {
      label: 'Cerradas este año',
      value: matriculas.filter(
        (m) =>
          m.etapa === 'cerrado' &&
          new Date(m.updated_at).getFullYear() === ahora.getFullYear()
      ).length,
      sub: `año ${ahora.getFullYear()}`,
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Métricas operativas del sistema de matrículas
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-border rounded-lg p-6">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">
              Matrículas creadas por mes (últimos 12 meses)
            </h2>
            <MatriculasPorMesChart data={meses} />
          </div>

          <div className="bg-white border border-border rounded-lg p-6">
            <h2 className="font-semibold text-gray-800 mb-4 text-sm">
              Distribución por etapa
            </h2>
            <DistribucionEtapaChart data={distribucion} />
          </div>
        </div>

        {/* Tabla por etapa */}
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Etapa</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">% del total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ETAPAS_ORDEN.map((etapa) => {
                const count = matriculas.filter((m) => m.etapa === etapa).length
                const pct = matriculas.length > 0
                  ? ((count / matriculas.length) * 100).toFixed(1)
                  : '0.0'
                return (
                  <tr key={etapa} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{ETAPA_INFO[etapa].label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{count}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                      {pct}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
