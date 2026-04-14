'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface MatriculasPorMesProps {
  data: Array<{ mes: string; count: number }>
}

export function MatriculasPorMesChart({ data }: MatriculasPorMesProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => [v, 'Matrículas']}
        />
        <Bar dataKey="count" fill="#1D9E75" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface DistribucionEtapaProps {
  data: Array<{ etapa: string; label: string; count: number; color: string }>
}

const ETAPA_COLORS: Record<string, string> = {
  registrada: '#9CA3AF',
  docs_pendientes: '#F59E0B',
  docs_completos: '#3B82F6',
  oposicion_pendiente: '#F97316',
  oposicion_puesta: '#22C55E',
  traspaso_en_proceso: '#14B8A6',
  traspaso_completado: '#10B981',
  cerrado: '#64748B',
}

export function DistribucionEtapaChart({ data }: DistribucionEtapaProps) {
  const dataConColor = data.map((d) => ({
    ...d,
    fill: ETAPA_COLORS[d.etapa] ?? '#9CA3AF',
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={dataConColor}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) =>
            (percent ?? 0) > 0.05 ? `${name} (${((percent ?? 0) * 100).toFixed(0)}%)` : ''
          }
          labelLine={false}
          fontSize={10}
        >
          {dataConColor.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v, name) => [v, name]}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
