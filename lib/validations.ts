import { z } from 'zod'

const cedulaRD = z
  .string()
  .regex(/^\d{3}-\d{7}-\d{1}$/, 'Formato: 000-0000000-0')

const telefonoRD = z
  .string()
  .regex(/^(809|829|849)-\d{3}-\d{4}$/, 'Formato: 809-000-0000')

export const personaSchema = z.object({
  nombre: z.string().min(2, 'Requerido (mínimo 2 caracteres)'),
  apellido: z.string().min(2, 'Requerido (mínimo 2 caracteres)'),
  cedula: z.union([cedulaRD, z.literal('')]).optional(),
  telefono: z.union([telefonoRD, z.literal('')]).optional(),
  direccion: z.string().optional(),
})

export const matriculaSchema = z.object({
  numero_credito: z.string().optional(),
  codigo: z.string().optional(),
  placa: z.string().min(1, 'La placa es requerida'),
  chasis: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  año: z.number().int().min(1990, 'Año mínimo: 1990').max(2030, 'Año máximo: 2030').optional(),
  color: z.string().optional(),
  lleva_traspaso: z.boolean(),
  lleva_oposicion: z.boolean(),
  notas: z.string().optional(),
  comprador: personaSchema,
  vendedor: personaSchema,
})

export type MatriculaFormValues = z.infer<typeof matriculaSchema>
export type PersonaFormValues = z.infer<typeof personaSchema>

export const oposicionSchema = z.object({
  fecha_oposicion: z.date({ error: 'La fecha es requerida' }),
})

export const traspasoSchema = z.object({
  fecha_traspaso: z.date({ error: 'La fecha es requerida' }),
})
