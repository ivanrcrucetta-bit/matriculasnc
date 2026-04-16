'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { matriculaSchema, type MatriculaFormValues } from '@/lib/validations'
import { crearMatricula } from '@/lib/actions'
import { cn } from '@/lib/utils'
import VehiculoSection from './VehiculoSection'
import PersonaSection from './PersonaSection'
import DuplicadosAlert from './DuplicadosAlert'
import DocumentoUploader from '../uploader/DocumentoUploader'
import { EMPTY_DRAFT, useMatriculaDraft } from '@/lib/stores/matricula-draft-store'

const STEPS = [
  { id: 0, label: 'Vehículo', desc: 'Datos del vehículo' },
  { id: 1, label: 'Cliente', desc: 'Comprador y vendedor' },
  { id: 2, label: 'Documentos', desc: 'Subida opcional' },
] as const

const FIELDS_POR_PASO: Record<number, Array<keyof MatriculaFormValues | string>> = {
  0: ['placa', 'marca', 'modelo', 'año', 'chasis', 'color', 'lleva_traspaso', 'lleva_oposicion'],
  1: [
    'numero_credito',
    'comprador.nombre',
    'comprador.apellido',
    'comprador.cedula',
    'comprador.telefono',
    'comprador.provincia',
    'comprador.municipio',
    'comprador.sector',
    'vendedor.nombre',
    'vendedor.apellido',
    'vendedor.cedula',
    'vendedor.telefono',
  ],
  2: [],
}

/**
 * Wizard de 3 pasos para crear una matrícula.
 * Estado persistido en sessionStorage via zustand, así el usuario no pierde
 * el avance si cierra la pestaña por error.
 */
export default function MatriculaWizard() {
  const router = useRouter()
  const {
    draft,
    step,
    matriculaIdCreada,
    touched,
    setFullDraft,
    setStep,
    setMatriculaIdCreada,
    reset,
  } = useMatriculaDraft()

  const [saving, setSaving] = useState(false)
  const [ultimoGuardado, setUltimoGuardado] = useState<Date | null>(null)
  const [hidratado, setHidratado] = useState(false)

  const form = useForm<MatriculaFormValues>({
    resolver: zodResolver(matriculaSchema),
    defaultValues: draft,
    mode: 'onChange',
  })

  // Hidratar el form con el draft persistido al montar
  useEffect(() => {
    form.reset(draft)
    setHidratado(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave al store cada vez que cambien los valores
  const values = form.watch()
  const ultimoSyncRef = useRef<string>('')
  useEffect(() => {
    if (!hidratado) return
    const serialized = JSON.stringify(values)
    if (serialized === ultimoSyncRef.current) return
    ultimoSyncRef.current = serialized
    setFullDraft(values as MatriculaFormValues)
    setUltimoGuardado(new Date())
  }, [values, hidratado, setFullDraft])

  async function irAlSiguiente() {
    const campos = FIELDS_POR_PASO[step] as Array<keyof MatriculaFormValues>
    const valido = campos.length === 0 ? true : await form.trigger(campos)
    if (!valido) {
      toast.error('Revisa los campos marcados en rojo', {
        id: 'wizard-step-error',
      })
      return
    }
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  function irAnterior() {
    if (step > 0) setStep(step - 1)
  }

  async function onCrear() {
    const valido = await form.trigger()
    if (!valido) {
      toast.error('Revisa los campos marcados en rojo')
      return
    }
    if (matriculaIdCreada) {
      router.push(`/matriculas/${matriculaIdCreada}`)
      return
    }
    setSaving(true)
    try {
      const { id } = await crearMatricula(form.getValues())
      setMatriculaIdCreada(id)
      setStep(2)
      toast.success('Matrícula creada — sube documentos o finaliza.', {
        id: 'wizard-crear-ok',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      if (!msg.includes('NEXT_REDIRECT')) toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  function finalizar() {
    if (!matriculaIdCreada) return
    const id = matriculaIdCreada
    reset()
    router.push(`/matriculas/${id}`)
  }

  function descartar() {
    if (!confirm('¿Descartar este borrador? Se perderán los datos ingresados.'))
      return
    reset()
    form.reset(EMPTY_DRAFT)
    toast.info('Borrador descartado')
  }

  const placaActual = form.watch('placa')
  const chasisActual = form.watch('chasis')
  const creditoActual = form.watch('numero_credito')

  return (
    <Form {...form}>
      <form className="space-y-5 max-w-3xl">
        <StepperHeader step={step} />

        {/* Autosave indicator */}
        {touched && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Save className="h-3 w-3" />
            {ultimoGuardado ? (
              <>
                Borrador guardado automáticamente
                {ultimoGuardado &&
                  ` a las ${ultimoGuardado.toLocaleTimeString('es-DO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
              </>
            ) : (
              'Autoguardado activo'
            )}
            <button
              type="button"
              onClick={descartar}
              className="ml-2 underline hover:text-red-600"
            >
              Descartar
            </button>
          </div>
        )}

        {/* Alerta de duplicados (visible en paso vehículo y cliente) */}
        {step < 2 && (
          <DuplicadosAlert
            placa={placaActual}
            chasis={chasisActual ?? undefined}
            numero_credito={creditoActual ?? undefined}
          />
        )}

        {/* Paso 0: Vehículo */}
        {step === 0 && (
          <Card>
            <CardHeader className="pb-2">
              <h2 className="font-semibold text-gray-800">Datos del vehículo</h2>
              <p className="text-xs text-muted-foreground">
                Placa, marca, modelo y flags del caso.
              </p>
            </CardHeader>
            <CardContent>
              <VehiculoSection form={form} />
            </CardContent>
          </Card>
        )}

        {/* Paso 1: Cliente + Vendedor */}
        {step === 1 && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-semibold text-gray-800">Cliente</h2>
              </CardHeader>
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
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-semibold text-gray-800">
                  Vendedor{' '}
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    Opcional
                  </span>
                </h2>
              </CardHeader>
              <CardContent>
                <PersonaSection
                  form={form}
                  prefix="vendedor"
                  titulo="Datos del Vendedor"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-semibold text-gray-800">Notas</h2>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notas"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Observaciones iniciales sobre esta matrícula..."
                          className="min-h-[80px]"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Paso 2: Documentos */}
        {step === 2 && (
          <Card>
            <CardHeader className="pb-2">
              <h2 className="font-semibold text-gray-800">
                Documentos{' '}
                {matriculaIdCreada ? (
                  <CheckCircle2 className="inline-block h-4 w-4 text-nc-green ml-1" />
                ) : null}
              </h2>
              <p className="text-xs text-muted-foreground">
                Arrastra varios archivos a la vez. Cada uno se sube con progreso
                real y se registra automáticamente al terminar.
              </p>
            </CardHeader>
            <CardContent>
              {matriculaIdCreada ? (
                <DocumentoUploader matriculaId={matriculaIdCreada} />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-muted-foreground">
                  La matrícula aún no se ha creado. Haz click en{' '}
                  <strong>Crear matrícula</strong> para poder subir documentos.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navegación */}
        <div className="flex items-center justify-between gap-3 pb-8 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={irAnterior}
            disabled={step === 0 || saving}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>

          <div className="flex items-center gap-2">
            {step < 2 && (
              <Button
                type="button"
                onClick={irAlSiguiente}
                disabled={saving}
                className="bg-nc-green hover:bg-nc-green-dark gap-1"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 2 && !matriculaIdCreada && (
              <Button
                type="button"
                onClick={onCrear}
                disabled={saving}
                className="bg-nc-green hover:bg-nc-green-dark gap-1"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Crear matrícula
              </Button>
            )}
            {step === 2 && matriculaIdCreada && (
              <Button
                type="button"
                onClick={finalizar}
                className="bg-nc-green hover:bg-nc-green-dark gap-1"
              >
                Ir al detalle
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}

// ---------------------------------------------------------------------------

function StepperHeader({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const activo = i === step
        const completado = i < step
        return (
          <li key={s.id} className="flex-1 flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0',
                activo && 'bg-nc-green text-white',
                completado && 'bg-nc-green-light text-nc-green-dark',
                !activo && !completado && 'bg-gray-100 text-gray-500'
              )}
            >
              {completado ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-xs font-medium truncate',
                  activo ? 'text-gray-900' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1',
                  completado ? 'bg-nc-green' : 'bg-gray-200'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
