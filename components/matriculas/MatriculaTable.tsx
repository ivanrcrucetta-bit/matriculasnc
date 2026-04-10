'use client'

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
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import EtapaBadge from './EtapaBadge'
import { diasDesde } from '@/lib/fecha'
import type { MatriculaConPersonas, TipoDocumento } from '@/types'

interface MatriculaTableProps {
  matriculas: MatriculaConPersonas[]
  documentosPorMatricula: Record<string, TipoDocumento[]>
}

export default function MatriculaTable({
  matriculas,
  documentosPorMatricula,
}: MatriculaTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Código</TableHead>
            <TableHead>Comprador</TableHead>
            <TableHead>Placa</TableHead>
            <TableHead>Crédito</TableHead>
            <TableHead className="text-center">Docs</TableHead>
            <TableHead className="text-center">Oposición</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead className="text-right">Días</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {matriculas.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                No hay matrículas para mostrar
              </TableCell>
            </TableRow>
          )}
          {matriculas.map((m) => {
            const comprador = m.personas.find((p) => p.rol === 'comprador')
            const tipos = documentosPorMatricula[m.id] ?? []
            const docsOk =
              tipos.includes('copia_matricula') &&
              tipos.includes('cedula_comprador') &&
              tipos.includes('cedula_vendedor')
            const dias = diasDesde(m.updated_at)

            return (
              <TableRow key={m.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-sm font-medium">
                  {m.codigo}
                </TableCell>
                <TableCell>
                  {comprador
                    ? `${comprador.nombre} ${comprador.apellido}`
                    : '—'}
                </TableCell>
                <TableCell className="text-sm">{m.placa ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.numero_credito ?? '—'}
                </TableCell>
                <TableCell className="text-center">
                  {docsOk ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                  )}
                </TableCell>
                <TableCell className="text-center">
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
                <TableCell className="text-right text-sm text-muted-foreground">
                  {dias}d
                </TableCell>
                <TableCell>
                  <Link href={`/matriculas/${m.id}`}>
                    <Button size="sm" variant="ghost" className="gap-1">
                      Ver
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
  )
}
