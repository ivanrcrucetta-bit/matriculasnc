import { z } from 'zod'

const cedulaRD = z
  .string()
  .regex(/^\d{3}-\d{7}-\d{1}$/, 'Formato: 000-0000000-0')

const telefonoRD = z
  .string()
  .regex(/^(809|829|849)-\d{3}-\d{4}$/, 'Formato: 809-000-0000')

const pasaporteRegex = z
  .string()
  .max(20, 'Máximo 20 caracteres')
  .regex(/^[A-Za-z0-9-]+$/, 'Solo letras, números y guion')

/**
 * Esquema unificado de persona (comprador o vendedor).
 *
 * Todo opcional — filosofía del sistema: control, no bloqueo. Los formatos RD
 * se exigen solo cuando el valor no está vacío. El pasaporte acepta cualquier
 * alfanumérico + guion hasta 20 caracteres.
 */
export const personaSchema = z.object({
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  cedula: z.union([cedulaRD, z.literal('')]).optional(),
  pasaporte: z.union([pasaporteRegex, z.literal('')]).optional(),
  telefono: z.union([telefonoRD, z.literal('')]).optional(),
  direccion: z.string().optional(),
  provincia: z.string().optional(),
  municipio: z.string().optional(),
  sector: z.string().optional(),
})

export const vendedorSchema = personaSchema

export const matriculaSchema = z.object({
  numero_credito: z.string().optional(),
  codigo: z.string().optional(),
  placa: z.string().min(1, 'La placa es requerida'),
  chasis: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  año: z
    .number()
    .int()
    .min(1900, 'Año mínimo: 1900')
    .max(new Date().getFullYear() + 1, `Año máximo: ${new Date().getFullYear() + 1}`)
    .optional(),
  color: z.string().optional(),
  lleva_traspaso: z.boolean(),
  lleva_oposicion: z.boolean(),
  notas: z.string().optional(),
  comprador: personaSchema,
  vendedor: vendedorSchema,
})

export type MatriculaFormValues = z.infer<typeof matriculaSchema>
export type PersonaFormValues = z.infer<typeof personaSchema>
export type VendedorFormValues = z.infer<typeof vendedorSchema>

export const oposicionSchema = z.object({
  fecha_oposicion: z.date({ error: 'La fecha es requerida' }),
})

export const traspasoSchema = z.object({
  fecha_traspaso: z.date({ error: 'La fecha es requerida' }),
})

/**
 * Entrega final al cliente que saldó. La fecha y el nombre del receptor son
 * obligatorios (es un acto formal: alguien firmó recibido); la cédula y el
 * pasaporte son opcionales. La copia firmada se maneja aparte como documento.
 */
export const entregaSchema = z.object({
  fecha_entrega: z.date({ error: 'La fecha es requerida' }),
  receptor_nombre: z.string().min(2, 'Nombre del receptor requerido'),
  receptor_cedula: z.union([cedulaRD, z.literal('')]).optional(),
  receptor_pasaporte: z.union([pasaporteRegex, z.literal('')]).optional(),
})

export type EntregaFormValues = z.infer<typeof entregaSchema>
