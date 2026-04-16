'use client'

import { useState } from 'react'
import { es } from 'date-fns/locale'
import { CalendarIcon, Loader2, Printer, FileDown, CheckCircle, X, ScanLine } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  registrarOposicion,
  retirarOposicion,
  iniciarTraspaso,
  completarTraspaso,
  cerrarCaso,
} from '@/lib/actions'
import { calcularBloqueos } from '@/lib/pipeline'
import type { Matricula, Documento } from '@/types'

interface PanelAccionesProps {
  matricula: Matricula
  documentos: Documento[]
}

function DatePickerAction({
  label,
  onConfirm,
  loading,
}: {
  label: string
  onConfirm: (date: Date) => Promise<void>
  loading: boolean
}) {
  const [open, setOpen] = useState(false)
  const [fecha, setFecha] = useState<Date | undefined>()

  async function handleConfirm() {
    if (!fecha) return
    await onConfirm(fecha)
    setOpen(false)
    setFecha(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2" disabled={loading}>
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={fecha}
            onSelect={setFecha}
            locale={es}
            initialFocus
          />
          <div className="flex gap-2 px-1 pb-1">
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!fecha || loading}
              className="flex-1 bg-nc-green hover:bg-nc-green-dark"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function PanelAcciones({ matricula, documentos }: PanelAccionesProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const bloqueos = calcularBloqueos(matricula, documentos)
  const sinBloqueos = bloqueos.length === 0

  async function run(
    key: string,
    fn: () => Promise<void>,
    opts?: { suppressErrorToast?: boolean }
  ) {
    setLoading(key)
    try {
      await fn()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      if (
        !msg.includes('NEXT_REDIRECT') &&
        !opts?.suppressErrorToast
      ) {
        toast.error(msg)
      }
    } finally {
      setLoading(null)
    }
  }

  const puedeOponerRegistrar =
    matricula.lleva_oposicion &&
    !matricula.fecha_oposicion &&
    matricula.etapa !== 'cerrado'

  const puedeOponerRetirar =
    matricula.lleva_oposicion && !!matricula.fecha_oposicion

  const puedeIniciarTraspaso =
    matricula.lleva_traspaso &&
    matricula.etapa !== 'traspaso_en_proceso' &&
    matricula.etapa !== 'traspaso_completado' &&
    matricula.etapa !== 'cerrado'

  const puedeCompletarTraspaso = matricula.etapa === 'traspaso_en_proceso'

  const puedeCerrar =
    sinBloqueos &&
    matricula.etapa !== 'cerrado' &&
    (matricula.etapa === 'traspaso_completado' ||
      matricula.etapa === 'docs_completos' ||
      matricula.etapa === 'oposicion_puesta')

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800 text-sm">Acciones</h3>

      {/* Oposición */}
      {(puedeOponerRegistrar || puedeOponerRetirar) && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Oposición
          </p>
          {puedeOponerRegistrar && (
            <DatePickerAction
              label="Registrar fecha de oposición"
              loading={loading === 'oposicion'}
              onConfirm={(fecha) =>
                run(
                  'oposicion',
                  async () => {
                    await toast
                      .promise(registrarOposicion(matricula.id, fecha), {
                        loading: 'Registrando...',
                        success: 'Oposición registrada',
                        error: 'Error al registrar',
                      })
                      .unwrap()
                  },
                  { suppressErrorToast: true }
                )
              }
            />
          )}
          {puedeOponerRetirar && (
            <Button
              variant="outline"
              className="w-full gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              disabled={loading === 'retirar-oposicion'}
              onClick={() =>
                run('retirar-oposicion', async () => {
                  await retirarOposicion(matricula.id)
                  toast.success('Oposición retirada')
                })
              }
            >
              {loading === 'retirar-oposicion' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Retirar oposición
            </Button>
          )}
        </div>
      )}

      {/* Traspaso */}
      {(puedeIniciarTraspaso || puedeCompletarTraspaso) && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Traspaso
            </p>
            {puedeIniciarTraspaso && (
              <DatePickerAction
                label="Iniciar traspaso (fecha inicio)"
                loading={loading === 'traspaso'}
                onConfirm={(fecha) =>
                  run(
                    'traspaso',
                    async () => {
                      await toast
                        .promise(iniciarTraspaso(matricula.id, fecha), {
                          loading: 'Registrando...',
                          success: 'Traspaso iniciado',
                          error: 'Error',
                        })
                        .unwrap()
                    },
                    { suppressErrorToast: true }
                  )
                }
              />
            )}
            {puedeCompletarTraspaso && (
              <Button
                variant="outline"
                className="w-full gap-2 text-teal-600 border-teal-200 hover:bg-teal-50"
                disabled={loading === 'completar-traspaso'}
                onClick={() =>
                  run('completar-traspaso', async () => {
                    await completarTraspaso(matricula.id)
                    toast.success('Traspaso completado')
                  })
                }
              >
                {loading === 'completar-traspaso' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Completar traspaso
              </Button>
            )}
          </div>
        </>
      )}

      {/* Cerrar caso */}
      {matricula.etapa !== 'cerrado' && (
        <>
          <Separator />
          <div className="space-y-2">
            <Button
              className={cn(
                'w-full gap-2',
                puedeCerrar
                  ? 'bg-nc-green hover:bg-nc-green-dark'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
              disabled={!puedeCerrar || loading === 'cerrar'}
              onClick={() =>
                run('cerrar', async () => {
                  await cerrarCaso(matricula.id)
                  toast.success('Caso cerrado correctamente')
                })
              }
            >
              {loading === 'cerrar' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Cerrar caso
            </Button>
            {!puedeCerrar && (
              <p className="text-xs text-muted-foreground text-center">
                Resuelve los bloqueos antes de cerrar
              </p>
            )}
          </div>
        </>
      )}

      {/* Print / PDF */}
      <Separator />
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Documentos
        </p>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => window.open(`/matriculas/${matricula.id}/sobre`, '_blank')}
        >
          <Printer className="h-4 w-4" />
          Imprimir sobre
        </Button>
        <Link href={`/matriculas/${matricula.id}/imprimir`} target="_blank" className="block">
          <Button variant="outline" className="w-full gap-2">
            <ScanLine className="h-4 w-4" />
            Imprimir documentos
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => window.open(`/api/matriculas/${matricula.id}/expediente`, '_blank')}
        >
          <FileDown className="h-4 w-4" />
          Descargar expediente PDF
        </Button>
      </div>
    </div>
  )
}
