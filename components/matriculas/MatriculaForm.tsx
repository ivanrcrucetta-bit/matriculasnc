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
import { crearMatricula, actualizarMatricula } from '@/lib/actions'
import type { Matricula, Persona } from '@/types'

interface MatriculaFormProps {
  matricula?: Matricula
  personas?: Persona[]
  modo: 'crear' | 'editar'
}

function SeccionHeader({
  titulo,
  open,
  onToggle,
}: {
  titulo: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-1 text-left"
    >
      <span className="font-semibold text-gray-800">{titulo}</span>
      {open ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}

function PersonaFields({
  form,
  prefix,
  titulo,
}: {
  form: ReturnType<typeof useForm<MatriculaFormValues>>
  prefix: 'comprador' | 'vendedor'
  titulo: string
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
        {titulo}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.nombre`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Juan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.apellido`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input placeholder="Pérez" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.cedula`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cédula</FormLabel>
              <FormControl>
                <Input placeholder="001-0000000-0" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.telefono`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="809-000-0000" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name={`${prefix}.direccion`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dirección</FormLabel>
            <FormControl>
              <Input placeholder="Calle, sector, ciudad" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export default function MatriculaForm({ matricula, personas, modo }: MatriculaFormProps) {
  const [saving, setSaving] = useState(false)
  const [secOpen, setSecOpen] = useState({
    vehiculo: true,
    comprador: true,
    vendedor: true,
    docs: true,
    notas: true,
  })

  const comprador = personas?.find((p) => p.rol === 'comprador')
  const vendedor = personas?.find((p) => p.rol === 'vendedor')

  const form = useForm<MatriculaFormValues>({
    resolver: zodResolver(matriculaSchema),
    defaultValues: {
      numero_credito: matricula?.numero_credito ?? '',
      codigo: matricula?.codigo ?? '',
      placa: matricula?.placa ?? '',
      chasis: matricula?.chasis ?? '',
      marca: matricula?.marca ?? '',
      modelo: matricula?.modelo ?? '',
      año: matricula?.año ?? undefined,
      color: matricula?.color ?? '',
      lleva_traspaso: matricula?.lleva_traspaso ?? true,
      lleva_oposicion: matricula?.lleva_oposicion ?? true,
      notas: matricula?.notas ?? '',
      comprador: {
        nombre: comprador?.nombre ?? '',
        apellido: comprador?.apellido ?? '',
        cedula: comprador?.cedula ?? '',
        telefono: comprador?.telefono ?? '',
        direccion: comprador?.direccion ?? '',
      },
      vendedor: {
        nombre: vendedor?.nombre ?? '',
        apellido: vendedor?.apellido ?? '',
        cedula: vendedor?.cedula ?? '',
        telefono: vendedor?.telefono ?? '',
        direccion: vendedor?.direccion ?? '',
      },
    },
  })

  async function onSubmit(values: MatriculaFormValues) {
    setSaving(true)
    try {
      if (modo === 'crear') {
        // Para crear: necesitamos un ID temporal para subir archivos
        // Los docs se suben después de obtener el ID desde la action
        // En este flujo los docs se pasan como metadata sin subir primero
        // La action crea la matrícula y nos redirige al detalle
        // Los docs se suben desde el detalle o aquí con un flujo 2-paso

        // Flujo simplificado: crear matrícula primero, luego subir docs
        // Para obtener el ID necesitamos crear sin docs y luego subirlos
        // Esto requiere un intermediate step - usaremos la action sin docs
        // y la redireccion al detalle donde se pueden subir
        // 
        // Si hay docs pendientes, los subimos después de crear via una ruta especial
        // Por ahora pasamos empty y el usuario sube desde el detalle

        await crearMatricula(values, [])
      } else if (matricula) {
        await actualizarMatricula(matricula.id, values)
        toast.success('Matrícula actualizada correctamente')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      // Si es un NEXT_REDIRECT no es un error real
      if (!msg.includes('NEXT_REDIRECT')) {
        toast.error(msg)
        setSaving(false)
      }
    }
  }

  const toggle = (key: keyof typeof secOpen) =>
    setSecOpen((s) => ({ ...s, [key]: !s[key] }))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Sección 1: Crédito y vehículo */}
        <Card>
          <CardHeader className="pb-2">
            <SeccionHeader
              titulo="Crédito y Vehículo"
              open={secOpen.vehiculo}
              onToggle={() => toggle('vehiculo')}
            />
          </CardHeader>
          {secOpen.vehiculo && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numero_credito"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Crédito</FormLabel>
                      <FormControl>
                        <Input placeholder="ej. CRD-2025-001" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Código{' '}
                        <span className="text-xs text-muted-foreground font-normal">
                          (auto-generado)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="NC-2025-001"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="placa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa *</FormLabel>
                      <FormControl>
                        <Input placeholder="A000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Corolla" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="año"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2024"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="Blanco" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="chasis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chasis</FormLabel>
                      <FormControl>
                        <Input placeholder="VIN" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
              <div className="flex gap-8">
                <FormField
                  control={form.control}
                  name="lleva_traspaso"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4 accent-nc-green"
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        ¿Lleva traspaso?
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lleva_oposicion"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4 accent-nc-green"
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        ¿Lleva oposición?
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Sección 2: Comprador */}
        <Card>
          <CardHeader className="pb-2">
            <SeccionHeader
              titulo="Cliente"
              open={secOpen.comprador}
              onToggle={() => toggle('comprador')}
            />
          </CardHeader>
          {secOpen.comprador && (
            <CardContent>
              <PersonaFields form={form} prefix="comprador" titulo="Datos del Cliente" />
            </CardContent>
          )}
        </Card>

        {/* Sección 3: Vendedor */}
        <Card>
          <CardHeader className="pb-2">
            <SeccionHeader
              titulo="Vendedor"
              open={secOpen.vendedor}
              onToggle={() => toggle('vendedor')}
            />
          </CardHeader>
          {secOpen.vendedor && (
            <CardContent>
              <PersonaFields form={form} prefix="vendedor" titulo="Datos del Vendedor" />
            </CardContent>
          )}
        </Card>

        {/* Sección 5: Notas */}
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
            ) : modo === 'crear' ? (
              'Crear Matrícula'
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
