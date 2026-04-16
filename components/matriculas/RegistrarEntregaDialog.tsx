'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { entregaSchema, type EntregaFormValues } from '@/lib/validations'
import { registrarEntrega } from '@/lib/actions'
import { formatCedulaRD } from '@/lib/format-rd'
import { cn } from '@/lib/utils'
import DocumentoUploader from './uploader/DocumentoUploader'

interface RegistrarEntregaDialogProps {
  matriculaId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Nombre sugerido para pre-poblar el campo del receptor (normalmente el
   * nombre del comprador de la matrícula). Editable por si la copia la recibe
   * un familiar u otro representante.
   */
  nombreSugerido?: string
  cedulaSugerida?: string | null
}

/**
 * Diálogo para registrar la entrega final de la matrícula al cliente que
 * saldó. La fecha y el nombre del receptor son obligatorios; la cédula y el
 * pasaporte son opcionales. El acuse firmado es opcional: se sube como
 * documento del expediente vía el uploader (auto-commit) y, aunque el usuario
 * cierre el diálogo sin "Confirmar", el doc ya queda asociado — coherente con
 * la filosofía "control, no bloqueo".
 */
export default function RegistrarEntregaDialog({
  matriculaId,
  open,
  onOpenChange,
  nombreSugerido,
  cedulaSugerida,
}: RegistrarEntregaDialogProps) {
  const [saving, setSaving] = useState(false)

  const form = useForm<EntregaFormValues>({
    resolver: zodResolver(entregaSchema),
    defaultValues: {
      fecha_entrega: new Date(),
      receptor_nombre: nombreSugerido ?? '',
      receptor_cedula: cedulaSugerida ?? '',
      receptor_pasaporte: '',
    },
  })

  async function onSubmit(values: EntregaFormValues) {
    setSaving(true)
    try {
      await registrarEntrega(matriculaId, {
        fecha: values.fecha_entrega,
        receptor_nombre: values.receptor_nombre,
        receptor_cedula: values.receptor_cedula || null,
        receptor_pasaporte: values.receptor_pasaporte || null,
      })
      toast.success('Entrega registrada')
      onOpenChange(false)
      form.reset()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entregar matrícula</DialogTitle>
          <DialogDescription>
            Registra la entrega de la matrícula al cliente. Puedes adjuntar la
            copia firmada como acuse (opcional).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fecha_entrega"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de entrega *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'justify-start gap-2 font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="h-4 w-4" />
                            {field.value ? (
                              format(field.value, "d 'de' MMMM yyyy", {
                                locale: es,
                              })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(d) => d && field.onChange(d)}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receptor_nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del receptor *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Quién recibió la matrícula"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receptor_cedula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula del receptor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="001-0000000-0"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(formatCedulaRD(e.target.value))
                        }
                        maxLength={13}
                        inputMode="numeric"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receptor_pasaporte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pasaporte del receptor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AB1234567"
                        {...field}
                        value={field.value ?? ''}
                        maxLength={20}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-medium text-gray-800">
                  Acuse de entrega (opcional)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Sube una foto o PDF de la copia firmada por el receptor. Se
                  adjunta al expediente automáticamente.
                </p>
              </div>
              <DocumentoUploader
                matriculaId={matriculaId}
                tipoInicial="acuse_entrega"
                mostrarSelectorTipo={false}
                dense
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-nc-green hover:bg-nc-green-dark gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Confirmar entrega
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
