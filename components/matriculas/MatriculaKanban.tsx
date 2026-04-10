import { ETAPA_INFO, ETAPAS_ORDEN } from '@/types'
import type { MatriculaConPersonas, TipoDocumento } from '@/types'
import MatriculaCard from './MatriculaCard'

interface MatriculaKanbanProps {
  matriculas: MatriculaConPersonas[]
  documentosPorMatricula: Record<string, TipoDocumento[]>
}

export default function MatriculaKanban({
  matriculas,
  documentosPorMatricula,
}: MatriculaKanbanProps) {
  const etapasConMatriculas = ETAPAS_ORDEN.filter((etapa) =>
    matriculas.some((m) => m.etapa === etapa)
  )

  const columnas = etapasConMatriculas.length > 0 ? etapasConMatriculas : ETAPAS_ORDEN.slice(0, 5)

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {columnas.map((etapa) => {
        const info = ETAPA_INFO[etapa]
        const items = matriculas.filter((m) => m.etapa === etapa)

        const headerColor: Record<string, string> = {
          gray: 'bg-gray-50 border-gray-200 text-gray-700',
          amber: 'bg-amber-50 border-amber-200 text-amber-700',
          blue: 'bg-blue-50 border-blue-200 text-blue-700',
          orange: 'bg-orange-50 border-orange-200 text-orange-700',
          green: 'bg-green-50 border-green-200 text-green-700',
          teal: 'bg-teal-50 border-teal-200 text-teal-700',
          emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          slate: 'bg-slate-50 border-slate-200 text-slate-600',
        }

        return (
          <div
            key={etapa}
            className="flex-shrink-0 w-72 flex flex-col"
          >
            <div
              className={`flex items-center justify-between px-3 py-2.5 rounded-t-lg border ${headerColor[info.color]} mb-0`}
            >
              <span className="font-medium text-sm">{info.label}</span>
              <span className="text-xs font-semibold opacity-70 bg-white/60 rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </div>
            <div className="flex-1 bg-gray-50/50 border border-t-0 border-gray-100 rounded-b-lg p-2 space-y-2 min-h-[200px]">
              {items.map((m) => (
                <MatriculaCard
                  key={m.id}
                  matricula={m}
                  documentosTipos={documentosPorMatricula[m.id] ?? []}
                />
              ))}
              {items.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                  Sin matrículas
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
