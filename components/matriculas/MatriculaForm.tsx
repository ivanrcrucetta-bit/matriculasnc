'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { matriculaSchema, type MatriculaFormValues } from '@/lib/validations'
import { actualizarMatricula } from '@/lib/actions'
import type { Matricula, Persona } from '@/types'
import VehiculoSection from './form/VehiculoSection'
import PersonaSection from './form/PersonaSection'

interface MatriculaFormProps {
  matricula: Matricula
  personas?: Persona[]
  /**
   * @deprecated La creación usa MatriculaWizard. Este form ahora solo edita.
   */
  modo?: 'crear' | 'editar'
}

function SeccionHeader({
  titulo,
  subtitulo,
  open,
  onToggle,
}: {
  titulo: string
  subtitulo?: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-1 text-left"
    >
      <div>
        <span className="font-semibold text-gray-800">{titulo}</span>
        {subtitulo && (
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            {subtitulo}
          </span>
        )}
      </div>
      {open ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}

/**
 * Formulario de edición de matrícula. La creación ya no usa este componente:
 * ve a `MatriculaWizard` en `/matriculas/nueva`.
 */
export default function MatriculaForm({
  matricula,
  personas,
}: MatriculaFormProps) {
  const [saving, setSaving] = useState(false)
  const [secOpen, setSecOpen] = useState({
    vehiculo: true,
    comprador: true,
    vendedor: false,
    notas: false,
  })

  const comprador = personas?.find((p) => p.rol === 'comprador')
  const vendedor = personas?.find((p) => p.rol === 'vendedor')

  const form = useForm<MatriculaFormValues>({
    resolver: zodResolver(matriculaSchema),
    defaultValues: {
      numero_credito: matricula.numero_credito ?? '',
      codigo: matricula.codigo ?? '',
      placa: matricula.placa ?? '',
      chasis: matricula.chasis ?? '',
      marca: matricula.marca ?? '',
      modelo: matricula.modelo ?? '',
      año: matricula.año ?? undefined,
      color: matricula.color ?? '',
      lleva_traspaso: matricula.lleva_traspaso ?? true,
      lleva_oposicion: matricula.lleva_oposicion ?? true,
      notas: matricula.notas ?? '',
      comprador: {
        nombre: comprador?.nombre ?? '',
        apellido: comprador?.apellido ?? '',
        cedula: comprador?.cedula ?? '',
        pasaporte: comprador?.pasaporte ?? '',
        telefono: comprador?.telefono ?? '',
        direccion: comprador?.direccion ?? '',
        provincia: comprador?.provincia ?? '',
        municipio: comprador?.municipio ?? '',
        sector: comprador?.sector ?? '',
      },
      vendedor: {
        nombre: vendedor?.nombre ?? '',
        apellido: vendedor?.apellido ?? '',
        cedula: vendedor?.cedula ?? '',
        pasaporte: vendedor?.pasaporte ?? '',
        telefono: vendedor?.telefono ?? '',
        direccion: vendedor?.direccion ?? '',
        provincia: vendedor?.provincia ?? '',
        municipio: vendedor?.municipio ?? '',
        sector: vendedor?.sector ?? '',
      },
    },
  })

  async function onSubmit(values: MatriculaFormValues) {
    setSaving(true)
    try {
      await actualizarMatricula(matricula.id, values)
      toast.success('Matrícula actualizada correctamente')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: keyof typeof secOpen) =>
    setSecOpen((s) => ({ ...s, [key]: !s[key] }))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        <Card>
          <CardHeader className="pb-2">
            <SeccionHeader
              titulo="Vehículo"
              open={secOpen.vehiculo}
              onToggle={() => toggle('vehiculo')}
            />
          </CardHeader>
          {secOpen.vehiculo && (
            <CardContent>
              <VehiculoSection form={form} />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SeccionHeader
              titulo="Cliente"
              open={secOpen.comprador}
              onToggle={() => toggle('comprador')}
            />
          </CardHeader>
          {secOpen.comprador && (
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="numero_credito"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Código cliente</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ej: 1234"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <PersonaSection
                form={form}
                prefix="comprador"
                titulo="Datos del Cliente"
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SeccionHeader
              titulo="Vendedor"
              subtitulo="Opcional"
              open={secOpen.vendedor}
              onToggle={() => toggle('vendedor')}
            />
          </CardHeader>
          {secOpen.vendedor && (
            <CardContent>
              <PersonaSection
                form={form}
                prefix="vendedor"
                titulo="Datos del Vendedor"
              />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SeccionHeader
              titulo="Notas"
              open={secOpen.notas}
              onToggle={() => toggle('notas')}
            />
          </CardHeader>
          {secOpen.notas && (
            <CardContent>
              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones iniciales sobre esta matrícula..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>

        <div className="flex gap-3 pb-8">
          <Button
            type="submit"
            disabled={saving}
            className="bg-nc-green hover:bg-nc-green-dark"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  )
}
