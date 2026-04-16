'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import EtapaBadge from './EtapaBadge'
import DocPreviewBadge from './DocPreviewBadge'
import AccionesLote from './AccionesLote'
import { diasDesde } from '@/lib/fecha'
import { calcularSLA, SLA_COLORS } from '@/lib/sla'
import { cn } from '@/lib/utils'
import type { MatriculaConPersonas, DocResumen, TipoDocumento } from '@/types'

const DOCS_PRINCIPALES: TipoDocumento[] = [
  'copia_matricula',
  'cedula_comprador',
  'cedula_vendedor',
]

const DOC_SHORT: Record<TipoDocumento, string> = {
  copia_matricula: 'Matr.',
  cedula_comprador: 'Ced. C',
  cedula_vendedor: 'Ced. V',
  contrato_venta: 'Contrato',
  fotocopia_matricula_vigente: 'Matr. Vig.',
  comprobante_dgii: 'DGII',
  carta_credito: 'Carta Créd.',
  certificado_deuda: 'Cert. Deuda',
  poder_notarial: 'Poder Not.',
  carta_no_objecion: 'No Objeción',
  contrato_prenda: 'Prenda',
  acuse_entrega: 'Acuse',
  otro: 'Otro',
}

interface MatriculaTableProps {
  matriculas: MatriculaConPersonas[]
  documentosPorMatricula: Record<string, DocResumen[]>
}

export default function MatriculaTable({
  matriculas,
  documentosPorMatricula,
}: MatriculaTableProps) {
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  const todosSeleccionados =
    matriculas.length > 0 && seleccionados.length === matriculas.length

  function toggleTodos() {
    if (todosSeleccionados) {
      setSeleccionados([])
    } else {
      setSeleccionados(matriculas.map((m) => m.id))
    }
  }

  function toggleUno(id: string) {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-10">
                <Checkbox
                  checked={todosSeleccionados}
                  onCheckedChange={toggleTodos}
                  aria-label="Seleccionar todas"
                />
              </TableHead>
              <TableHead className="w-[90px]">Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Placa</TableHead>
              <TableHead className="hidden md:table-cell">Cód. cliente</TableHead>
              <TableHead className="hidden lg:table-cell">Documentos</TableHead>
              <TableHead className="text-center w-[60px] lg:hidden">Docs</TableHead>
              <TableHead className="text-center hidden md:table-cell">Oposición</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="hidden lg:table-cell w-[110px]">SLA</TableHead>
              <TableHead className="text-right hidden sm:table-cell w-[60px]">Días</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {matriculas.length === 0 && (
              <TableRow>
                <TableCell colSpan={100} className="text-center py-12 text-muted-foreground">
                  No hay matrículas para mostrar
                </TableCell>
              </TableRow>
            )}
            {matriculas.map((m) => {
              const comprador = m.personas.find((p) => p.rol === 'comprador')
              const docs = documentosPorMatricula[m.id] ?? []
              const docsMap = new Map(docs.map((d) => [d.tipo, d]))
              const docsOk = DOCS_PRINCIPALES.every((t) => docsMap.has(t))
              const dias = diasDesde(m.updated_at)
              const sla = calcularSLA(m.etapa, m.updated_at)
              const seleccionado = seleccionados.includes(m.id)

              return (
                <TableRow
                  key={m.id}
                  className={cn('hover:bg-gray-50', seleccionado && 'bg-blue-50/50')}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={seleccionado}
                      onCheckedChange={() => toggleUno(m.id)}
                      aria-label={`Seleccionar ${m.codigo}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    {m.codigo}
                  </TableCell>
                  <TableCell className="max-w-[140px]">
                    <span className="truncate block">
                      {comprador
                        ? `${comprador.nombre} ${comprador.apellido}`
                        : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm hidden sm:table-cell">{m.placa ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {m.numero_credito ?? '—'}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    <div
                      className="flex gap-1.5 flex-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {DOCS_PRINCIPALES.map((tipo) => (
                        <DocPreviewBadge
                          key={tipo}
                          doc={docsMap.get(tipo)}
                          shortLabel={DOC_SHORT[tipo]}
                        />
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-center lg:hidden">
                    {docsOk ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                    )}
                  </TableCell>

                  <TableCell className="text-center hidden md:table-cell">
                    {!m.lleva_oposicion ? (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    ) : m.fecha_oposicion ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-400 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell>
                    <EtapaBadge etapa={m.etapa} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {sla.nivel !== 'none' && (
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded border font-medium',
                          SLA_COLORS[sla.nivel]
                        )}
                      >
                        {sla.label}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                    {dias}d
                  </TableCell>
                  <TableCell>
                    <Link href={`/matriculas/${m.id}`}>
                      <Button size="sm" variant="ghost" className="gap-1 px-2">
                        <span className="hidden sm:inline">Ver</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AccionesLote
        seleccionados={seleccionados}
        matriculas={matriculas}
        onDeseleccionar={() => setSeleccionados([])}
      />
    </>
  )
}
