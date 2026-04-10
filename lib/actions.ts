'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { calcularEtapa } from '@/lib/pipeline'
import { formatISO } from '@/lib/fecha'
import type { MatriculaFormValues } from '@/lib/validations'
import type { Documento, Matricula, TipoDocumento, TipoEvento } from '@/types'

const SCHEMA = 'matriculas'

// Genera el código NC-YYYY-NNN via función SQL
async function generarCodigo(): Promise<string> {
  const supabase = createSupabaseServer()
  // Intentar con schema option primero
  const { data, error } = await supabase
    .schema(SCHEMA as 'public')
    .rpc('generar_codigo' as never)

  if (!error && data) return data as string

  // Fallback: calcular en JS si la RPC falla
  const año = new Date().getFullYear()
  const { data: rows } = await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .select('codigo')
    .like('codigo' as never, `NC-${año}-%`)
    .order('codigo' as never, { ascending: false })
    .limit(1)

  const ultimo = rows && (rows as { codigo: string }[]).length > 0
    ? parseInt((rows as { codigo: string }[])[0].codigo.split('-')[2]) || 0
    : 0

  return `NC-${año}-${String(ultimo + 1).padStart(3, '0')}`
}

async function registrarHistorial(
  supabase: ReturnType<typeof createSupabaseServer>,
  matricula_id: string,
  tipo_evento: TipoEvento,
  descripcion: string,
  usuario_nombre?: string
) {
  await supabase
    .schema(SCHEMA as 'public')
    .from('historial' as never)
    .insert({
      matricula_id,
      tipo_evento,
      descripcion,
      usuario_nombre: usuario_nombre ?? null,
    } as never)
}

async function sincronizarEtapa(
  supabase: ReturnType<typeof createSupabaseServer>,
  matriculaId: string
) {
  const { data: mat } = await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .select('*')
    .eq('id' as never, matriculaId)
    .single()

  const { data: docs } = await supabase
    .schema(SCHEMA as 'public')
    .from('documentos' as never)
    .select('tipo')
    .eq('matricula_id' as never, matriculaId)

  if (!mat) return

  const matricula = mat as Matricula
  const documentos = (docs ?? []) as Pick<Documento, 'tipo'>[]

  const nuevaEtapa = calcularEtapa(
    matricula,
    documentos as Documento[]
  )

  if (nuevaEtapa !== matricula.etapa) {
    await supabase
      .schema(SCHEMA as 'public')
      .from('matriculas' as never)
      .update({ etapa: nuevaEtapa } as never)
      .eq('id' as never, matriculaId)

    await registrarHistorial(
      supabase,
      matriculaId,
      'cambio_etapa',
      `Etapa actualizada a: ${nuevaEtapa}`
    )
  }
}

export async function crearMatricula(
  values: MatriculaFormValues,
  documentosData: {
    tipo: TipoDocumento
    nombre_archivo: string
    storage_path: string
  }[]
) {
  const supabase = createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const codigo = values.codigo || (await generarCodigo())

  // Insertar matrícula
  const { data: mat, error: matErr } = await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .insert({
      codigo,
      numero_credito: values.numero_credito || null,
      placa: values.placa,
      chasis: values.chasis || null,
      marca: values.marca || null,
      modelo: values.modelo || null,
      año: values.año ?? null,
      color: values.color || null,
      lleva_traspaso: values.lleva_traspaso,
      lleva_oposicion: values.lleva_oposicion,
      notas: values.notas || null,
      etapa: 'registrada',
      created_by: user?.id ?? null,
    } as never)
    .select('id')
    .single()

  if (matErr || !mat) throw new Error(matErr?.message ?? 'Error al crear matrícula')

  const { id: matricula_id } = mat as { id: string }

  // Insertar comprador y vendedor
  await supabase
    .schema(SCHEMA as 'public')
    .from('personas' as never)
    .insert([
      {
        matricula_id,
        rol: 'comprador',
        ...values.comprador,
        cedula: values.comprador.cedula || null,
        telefono: values.comprador.telefono || null,
      },
      {
        matricula_id,
        rol: 'vendedor',
        ...values.vendedor,
        cedula: values.vendedor.cedula || null,
        telefono: values.vendedor.telefono || null,
      },
    ] as never)

  // Insertar documentos si los hay
  if (documentosData.length > 0) {
    await supabase
      .schema(SCHEMA as 'public')
      .from('documentos' as never)
      .insert(
        documentosData.map((d) => ({
          matricula_id,
          tipo: d.tipo,
          nombre_archivo: d.nombre_archivo,
          storage_path: d.storage_path,
          subido_por: user?.id ?? null,
        })) as never
      )
  }

  // Historial de creación
  await registrarHistorial(
    supabase,
    matricula_id,
    'creacion',
    `Matrícula ${codigo} creada`,
    user?.email
  )

  // Sincronizar etapa
  await sincronizarEtapa(supabase, matricula_id)

  revalidatePath('/')
  revalidatePath('/matriculas')
  redirect(`/matriculas/${matricula_id}`)
}

export async function actualizarMatricula(
  id: string,
  values: Partial<MatriculaFormValues>
) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const update: Record<string, unknown> = {
    updated_by: user?.id ?? null,
  }

  if (values.placa !== undefined) update.placa = values.placa
  if (values.numero_credito !== undefined) update.numero_credito = values.numero_credito || null
  if (values.chasis !== undefined) update.chasis = values.chasis || null
  if (values.marca !== undefined) update.marca = values.marca || null
  if (values.modelo !== undefined) update.modelo = values.modelo || null
  if (values.año !== undefined) update.año = values.año ?? null
  if (values.color !== undefined) update.color = values.color || null
  if (values.lleva_traspaso !== undefined) update.lleva_traspaso = values.lleva_traspaso
  if (values.lleva_oposicion !== undefined) update.lleva_oposicion = values.lleva_oposicion
  if (values.notas !== undefined) update.notas = values.notas || null

  await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .update(update as never)
    .eq('id' as never, id)

  if (values.comprador) {
    await supabase
      .schema(SCHEMA as 'public')
      .from('personas' as never)
      .update({
        ...values.comprador,
        cedula: values.comprador.cedula || null,
        telefono: values.comprador.telefono || null,
      } as never)
      .eq('matricula_id' as never, id)
      .eq('rol' as never, 'comprador')
  }

  if (values.vendedor) {
    await supabase
      .schema(SCHEMA as 'public')
      .from('personas' as never)
      .update({
        ...values.vendedor,
        cedula: values.vendedor.cedula || null,
        telefono: values.vendedor.telefono || null,
      } as never)
      .eq('matricula_id' as never, id)
      .eq('rol' as never, 'vendedor')
  }

  await registrarHistorial(supabase, id, 'nota_agregada', 'Datos de la matrícula actualizados', user?.email)
  await sincronizarEtapa(supabase, id)

  revalidatePath(`/matriculas/${id}`)
  revalidatePath('/')
}

export async function subirDocumento(
  matriculaId: string,
  tipo: TipoDocumento,
  storageInfo: { nombre_archivo: string; storage_path: string }
) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA as 'public')
    .from('documentos' as never)
    .insert({
      matricula_id: matriculaId,
      tipo,
      nombre_archivo: storageInfo.nombre_archivo,
      storage_path: storageInfo.storage_path,
      subido_por: user?.id ?? null,
    } as never)

  await registrarHistorial(
    supabase,
    matriculaId,
    'documento_subido',
    `Documento subido: ${storageInfo.nombre_archivo}`,
    user?.email
  )

  await sincronizarEtapa(supabase, matriculaId)
  revalidatePath(`/matriculas/${matriculaId}`)
  revalidatePath('/')
}

export async function eliminarDocumento(matriculaId: string, documentoId: string, storagePath: string) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  // Eliminar de Storage
  await supabase.storage.from('matriculas-docs').remove([storagePath])

  // Eliminar de la tabla
  await supabase
    .schema(SCHEMA as 'public')
    .from('documentos' as never)
    .delete()
    .eq('id' as never, documentoId)

  await registrarHistorial(
    supabase,
    matriculaId,
    'documento_eliminado',
    `Documento eliminado`,
    user?.email
  )

  await sincronizarEtapa(supabase, matriculaId)
  revalidatePath(`/matriculas/${matriculaId}`)
}

export async function registrarOposicion(matriculaId: string, fecha: Date) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .update({ fecha_oposicion: formatISO(fecha), updated_by: user?.id ?? null } as never)
    .eq('id' as never, matriculaId)

  await registrarHistorial(
    supabase,
    matriculaId,
    'oposicion_registrada',
    `Oposición registrada el ${formatISO(fecha)}`,
    user?.email
  )

  await sincronizarEtapa(supabase, matriculaId)
  revalidatePath(`/matriculas/${matriculaId}`)
  revalidatePath('/')
}

export async function retirarOposicion(matriculaId: string) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .update({ fecha_oposicion: null, updated_by: user?.id ?? null } as never)
    .eq('id' as never, matriculaId)

  await registrarHistorial(
    supabase,
    matriculaId,
    'oposicion_retirada',
    'Oposición retirada',
    user?.email
  )

  await sincronizarEtapa(supabase, matriculaId)
  revalidatePath(`/matriculas/${matriculaId}`)
  revalidatePath('/')
}

export async function iniciarTraspaso(matriculaId: string, fecha: Date) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .update({
      fecha_traspaso: formatISO(fecha),
      etapa: 'traspaso_en_proceso',
      updated_by: user?.id ?? null,
    } as never)
    .eq('id' as never, matriculaId)

  await registrarHistorial(
    supabase,
    matriculaId,
    'traspaso_iniciado',
    `Traspaso iniciado el ${formatISO(fecha)}`,
    user?.email
  )

  revalidatePath(`/matriculas/${matriculaId}`)
  revalidatePath('/')
}

export async function completarTraspaso(matriculaId: string) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .update({
      etapa: 'traspaso_completado',
      updated_by: user?.id ?? null,
    } as never)
    .eq('id' as never, matriculaId)

  await registrarHistorial(
    supabase,
    matriculaId,
    'traspaso_completado',
    'Traspaso del vehículo completado',
    user?.email
  )

  revalidatePath(`/matriculas/${matriculaId}`)
  revalidatePath('/')
}

export async function cerrarCaso(matriculaId: string) {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .update({
      etapa: 'cerrado',
      updated_by: user?.id ?? null,
    } as never)
    .eq('id' as never, matriculaId)

  await registrarHistorial(
    supabase,
    matriculaId,
    'cierre',
    'Caso cerrado',
    user?.email
  )

  revalidatePath(`/matriculas/${matriculaId}`)
  revalidatePath('/')
}
