'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { matriculaSchema, type MatriculaFormValues } from '@/lib/validations'
import { crearMatricula, actualizarMatricula, subirDocumento } from '@/lib/actions'
import { getSupabaseBrowser } from '@/lib/supabase'
import { formatCedulaRD, formatTelefonoRD } from '@/lib/format-rd'
import { PROVINCIAS_RD, getMunicipios } from '@/lib/data/rd-provincias-municipios'
import { TIPO_DOC_LABELS } from '@/types'
import type { Matricula, Persona, TipoDocumento } from '@/types'
import DocumentoFilePicker from './DocumentoFilePicker'

interface MatriculaFormProps {
  matricula?: Matricula
  personas?: Persona[]
  modo: 'crear' | 'editar'
}

const DOCS_FORM: { tipo: TipoDocumento; label: string }[] = [
  { tipo: 'copia_matricula', label: 'Copia de Matrícula' },
  { tipo: 'cedula_comprador', label: 'Cédula del Cliente' },
  { tipo: 'cedula_vendedor', label: 'Cédula del Vendedor' },
]

// ---------------------------------------------------------------------------
// Componentes internos
// ---------------------------------------------------------------------------

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
          <span className="ml-2 text-xs text-muted-foreground font-normal">{subtitulo}</span>
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

function PersonaFields({
  form,
  prefix,
  titulo,
}: {
  form: ReturnType<typeof useForm<MatriculaFormValues>>
  prefix: 'comprador' | 'vendedor'
  titulo: string
}) {
  const provinciaSeleccionada = form.watch(`${prefix}.provincia` as `comprador.provincia`)

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">{titulo}</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.nombre` as `comprador.nombre`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Juan" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.apellido` as `comprador.apellido`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input placeholder="Pérez" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.cedula` as `comprador.cedula`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cédula</FormLabel>
              <FormControl>
                <Input
                  placeholder="001-0000000-0"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(formatCedulaRD(e.target.value))}
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
          name={`${prefix}.telefono` as `comprador.telefono`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  placeholder="809-000-0000"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(formatTelefonoRD(e.target.value))}
                  maxLength={12}
                  inputMode="numeric"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Dirección en cascada */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.provincia` as `comprador.provincia`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provincia</FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={(val) => {
                  field.onChange(val)
                  form.setValue(`${prefix}.municipio` as `comprador.municipio`, '')
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona provincia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROVINCIAS_RD.map((p) => (
                    <SelectItem key={p.nombre} value={p.nombre}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.municipio` as `comprador.municipio`}
          render={({ field }) => {
            const municipios = getMunicipios(provinciaSeleccionada ?? '')
            return (
              <FormItem>
                <FormLabel>Municipio</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  disabled={!provinciaSeleccionada}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={provinciaSeleccionada ? 'Selecciona municipio' : 'Elige provincia primero'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {municipios.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )
          }}
        />
      </div>
      <FormField
        control={form.control}
        name={`${prefix}.sector` as `comprador.sector`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sector / Calle</FormLabel>
            <FormControl>
              <Input placeholder="Ensanche Naco, Calle Principal #5" {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function MatriculaForm({ matricula, personas, modo }: MatriculaFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [secOpen, setSecOpen] = useState({
    vehiculo: true,
    comprador: true,
    vendedor: false,
    docs: true,
    notas: false,
  })

  const [archivos, setArchivos] = useState<Record<TipoDocumento, File | null>>({
    copia_matricula: null,
    cedula_comprador: null,
    cedula_vendedor: null,
    contrato_venta: null,
    fotocopia_matricula_vigente: null,
    comprobante_dgii: null,
    carta_credito: null,
    certificado_deuda: null,
    poder_notarial: null,
    carta_no_objecion: null,
    contrato_prenda: null,
    otro: null,
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
        provincia: comprador?.provincia ?? '',
        municipio: comprador?.municipio ?? '',
        sector: comprador?.sector ?? '',
      },
      vendedor: {
        nombre: vendedor?.nombre ?? '',
        apellido: vendedor?.apellido ?? '',
        cedula: vendedor?.cedula ?? '',
        telefono: vendedor?.telefono ?? '',
        direccion: vendedor?.direccion ?? '',
        provincia: vendedor?.provincia ?? '',
        municipio: vendedor?.municipio ?? '',
        sector: vendedor?.sector ?? '',
      },
    },
  })

  function setArchivo(tipo: TipoDocumento, file: File | null) {
    setArchivos((prev) => ({ ...prev, [tipo]: file }))
  }

  async function onSubmit(values: MatriculaFormValues) {
    setSaving(true)
    try {
      if (modo === 'crear') {
        const { id: matriculaId } = await crearMatricula(values)

        const supabase = getSupabaseBrowser()
        const docsTipos = DOCS_FORM.map((d) => d.tipo)

        for (const tipo of docsTipos) {
          const archivo = archivos[tipo]
          if (!archivo) continue

          const ts = Date.now()
          const path = `${matriculaId}/${tipo}/${ts}_${archivo.name}`

          const { error } = await supabase.storage
            .from('matriculas-docs')
            .upload(path, archivo)

          if (error) {
            toast.error(`Error al subir ${TIPO_DOC_LABELS[tipo]}: ${error.message}`)
            continue
          }

          await subirDocumento(matriculaId, tipo, {
            nombre_archivo: archivo.name,
            storage_path: path,
          })
        }

        router.push(`/matriculas/${matriculaId}`)
      } else if (matricula) {
        await actualizarMatricula(matricula.id, values)
        toast.success('Matrícula actualizada correctamente')
        setSaving(false)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
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

        {/* Sección 1: Vehículo */}
        <Card>
          <CardHeader className="pb-2">
            <SeccionHeader
              titulo="Vehículo"
              open={secOpen.vehiculo}
              onToggle={() => toggle('vehiculo')}
            />
          </CardHeader>
          {secOpen.vehiculo && (
            <CardContent className="space-y-4">
              {/* Código NC (auto-generado) */}
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>
                      Código{' '}
                      <span className="text-xs text-muted-foreground font-normal">(auto-generado)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="NC-2025-001" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
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
                      <FormLabel className="font-normal cursor-pointer">¿Lleva traspaso?</FormLabel>
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
                      <FormLabel className="font-normal cursor-pointer">¿Lleva oposición?</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Sección 2: Cliente */}
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
              {/* Código cliente aquí */}
              <FormField
                control={form.control}
                name="numero_credito"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Código cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="ej: 1234" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <PersonaFields form={form} prefix="comprador" titulo="Datos del Cliente" />
            </CardContent>
          )}
        </Card>

        {/* Sección 3: Vendedor (opcional) */}
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
              <PersonaFields form={form} prefix="vendedor" titulo="Datos del Vendedor" />
            </CardContent>
          )}
        </Card>

        {/* Sección 4: Documentos (solo crear) */}
        {modo === 'crear' && (
          <Card>
            <CardHeader className="pb-2">
              <SeccionHeader
                titulo="Documentos"
                subtitulo="Opcional"
                open={secOpen.docs}
                onToggle={() => toggle('docs')}
              />
            </CardHeader>
            {secOpen.docs && (
              <CardContent className="space-y-5">
                <p className="text-xs text-muted-foreground">
                  Puedes subir los escaneos ahora o agregarlos después desde el detalle de la matrícula.
                  Las imágenes se comprimen automáticamente para optimizar el almacenamiento.
                </p>
                {DOCS_FORM.map(({ tipo, label }) => (
                  <DocumentoFilePicker
                    key={tipo}
                    tipo={tipo}
                    label={label}
                    file={archivos[tipo]}
                    onSelect={(f) => setArchivo(tipo, f)}
                    onRemove={() => setArchivo(tipo, null)}
                  />
                ))}
              </CardContent>
            )}
          </Card>
        )}

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
                {modo === 'crear' ? 'Creando...' : 'Guardando...'}
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
