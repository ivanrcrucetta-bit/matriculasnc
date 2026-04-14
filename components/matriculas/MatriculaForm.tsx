'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Loader2, ChevronDown, ChevronUp, Upload, X, FileText, ImageIcon, FileCheck } from 'lucide-react'
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
import { crearMatricula, actualizarMatricula, subirDocumento } from '@/lib/actions'
import { getSupabaseBrowser } from '@/lib/supabase'
import { TIPO_DOC_LABELS } from '@/types'
import type { Matricula, Persona, TipoDocumento } from '@/types'

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

function DocFileSlot({
  tipo,
  label,
  file,
  onSelect,
  onRemove,
}: {
  tipo: TipoDocumento
  label: string
  file: File | null
  onSelect: (f: File) => void
  onRemove: () => void
}) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onSelect(accepted[0])
    },
    [onSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  const esImagen = file && /\.(jpe?g|png)$/i.test(file.name)
  const esPDF = file && /\.pdf$/i.test(file.name)
  const preview = file && esImagen ? URL.createObjectURL(file) : null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>

      {file ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-nc-green-light border border-nc-green">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={file.name}
              className="w-10 h-10 object-cover rounded border border-nc-green/30 flex-shrink-0"
            />
          ) : esPDF ? (
            <div className="w-10 h-10 flex items-center justify-center bg-red-50 rounded border border-red-200 flex-shrink-0">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-nc-green-light rounded border border-nc-green/30 flex-shrink-0">
              <FileCheck className="h-5 w-5 text-nc-green" />
            </div>
          )}
          <span className="flex-1 text-sm text-nc-green-dark truncate">{file.name}</span>
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-red-500 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-nc-green bg-nc-green-light'
              : 'border-gray-200 hover:border-nc-green hover:bg-nc-green-light/40'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span className="text-sm">
              {isDragActive ? 'Suelta aquí' : 'Arrastra o haz click'}
            </span>
            <ImageIcon className="h-4 w-4" />
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, PDF — máx. 10MB</p>
        </div>
      )}
    </div>
  )
}

export default function MatriculaForm({ matricula, personas, modo }: MatriculaFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [secOpen, setSecOpen] = useState({
    vehiculo: true,
    comprador: true,
    vendedor: true,
    docs: true,
    notas: true,
  })

  const [archivos, setArchivos] = useState<Record<TipoDocumento, File | null>>({
    copia_matricula: null,
    cedula_comprador: null,
    cedula_vendedor: null,
    contrato_venta: null,
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

  function setArchivo(tipo: TipoDocumento, file: File | null) {
    setArchivos((prev) => ({ ...prev, [tipo]: file }))
  }

  async function onSubmit(values: MatriculaFormValues) {
    setSaving(true)
    try {
      if (modo === 'crear') {
        const { id: matriculaId } = await crearMatricula(values)

        // Subir archivos seleccionados
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

        {/* Sección 4: Documentos (solo en modo crear) */}
        {modo === 'crear' && (
          <Card>
            <CardHeader className="pb-2">
              <SeccionHeader
                titulo="Documentos (opcional)"
                open={secOpen.docs}
                onToggle={() => toggle('docs')}
              />
            </CardHeader>
            {secOpen.docs && (
              <CardContent className="space-y-5">
                <p className="text-xs text-muted-foreground">
                  Puedes subir los escaneos ahora (JPG, PNG o PDF) o agregarlos después desde el detalle de la matrícula.
                </p>
                {DOCS_FORM.map(({ tipo, label }) => (
                  <DocFileSlot
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
