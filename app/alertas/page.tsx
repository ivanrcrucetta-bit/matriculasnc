import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'
import type { MatriculaConPersonas } from '@/types'
import { diasDesde } from '@/lib/fecha'

export default async function AlertasPage() {
  const supabase = createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const { data: mats } = await schema
    .from('matriculas' as never)
    .select('*, personas(*)')
    .neq('etapa' as never, 'cerrado')
    .order('updated_at' as never, { ascending: true })

  const matriculas = (mats ?? []) as MatriculaConPersonas[]

  const { data: docs } = await schema
    .from('documentos' as never)
    .select('matricula_id, tipo')

  const docsPorMat: Record<string, string[]> = {}
  for (const d of (docs ?? []) as { matricula_id: string; tipo: string }[]) {
    if (!docsPorMat[d.matricula_id]) docsPorMat[d.matricula_id] = []
    docsPorMat[d.matricula_id].push(d.tipo)
  }

  type AlertaLocal = {
    matricula: MatriculaConPersonas
    tipo: string
    descripcion: string
    dias: number
  }

  const alertas: AlertaLocal[] = []

  for (const m of matriculas) {
    const tipos = docsPorMat[m.id] ?? []
    const diasDesdeCreacion = diasDesde(m.created_at)
    const diasDesdeUpdate = diasDesde(m.updated_at)
    const diasDesdeTraspaso = m.fecha_traspaso ? diasDesde(m.fecha_traspaso) : 0

    if (m.etapa === 'registrada' && tipos.length === 0 && diasDesdeCreacion > 3) {
      alertas.push({
        matricula: m,
        tipo: 'Sin documentos',
        descripcion: `Registrada hace ${diasDesdeCreacion} días sin ningún documento`,
        dias: diasDesdeCreacion,
      })
    }

    if (
      m.lleva_oposicion &&
      !m.fecha_oposicion &&
      ['docs_completos', 'oposicion_pendiente'].includes(m.etapa) &&
      diasDesdeUpdate > 5
    ) {
      alertas.push({
        matricula: m,
        tipo: 'Oposición pendiente',
        descripcion: `Sin registrar oposición desde hace ${diasDesdeUpdate} días`,
        dias: diasDesdeUpdate,
      })
    }

    if (m.etapa === 'traspaso_en_proceso' && diasDesdeTraspaso > 45) {
      alertas.push({
        matricula: m,
        tipo: 'Traspaso lento',
        descripcion: `Traspaso en proceso hace ${diasDesdeTraspaso} días`,
        dias: diasDesdeTraspaso,
      })
    }

    if (diasDesdeUpdate > 15) {
      alertas.push({
        matricula: m,
        tipo: 'Sin actividad',
        descripcion: `Sin actualización en ${diasDesdeUpdate} días`,
        dias: diasDesdeUpdate,
      })
    }
  }

  alertas.sort((a, b) => b.dias - a.dias)

  return (
    <DashboardLayout alertasCount={alertas.length}>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Matrículas que requieren atención inmediata
          </p>
        </div>

        {alertas.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No hay alertas pendientes. ¡Todo al día!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertas.map((a, i) => {
              const comprador = a.matricula.personas?.find((p) => p.rol === 'comprador')
              return (
                <div
                  key={`${a.matricula.id}-${a.tipo}-${i}`}
                  className="flex items-center justify-between gap-4 p-4 bg-white border border-border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold">{a.matricula.codigo}</span>
                      {a.matricula.placa && (
                        <span className="text-xs text-muted-foreground">· {a.matricula.placa}</span>
                      )}
                      {comprador && (
                        <span className="text-xs text-muted-foreground">
                          · {comprador.nombre} {comprador.apellido}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        {a.tipo}
                      </span>
                      <span className="text-sm text-muted-foreground">{a.descripcion}</span>
                    </div>
                  </div>
                  <Link href={`/matriculas/${a.matricula.id}`}>
                    <Button size="sm" variant="outline" className="gap-1 flex-shrink-0">
                      Ver
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
