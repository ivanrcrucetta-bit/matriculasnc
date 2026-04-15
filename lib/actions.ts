'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { calcularEtapa } from '@/lib/pipeline'
import { formatISO } from '@/lib/fecha'
import type { MatriculaFormValues } from '@/lib/validations'
import type { Documento, Etapa, Matricula, TipoDocumento, TipoEvento } from '@/types'

const SCHEMA = 'matriculas'

// Genera el código NC-YYYY-NNN via función SQL
async function generarCodigo(): Promise<string> {
  const supabase = await createSupabaseServer()
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
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
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
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
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
  values: MatriculaFormValues
): Promise<{ id: string }> {
  const supabase = await createSupabaseServer()

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

  const compradorRow = {
    matricula_id,
    rol: 'comprador',
    ...values.comprador,
    cedula: values.comprador.cedula || null,
    telefono: values.comprador.telefono || null,
    provincia: values.comprador.provincia || null,
    municipio: values.comprador.municipio || null,
    sector: values.comprador.sector || null,
  }

  const vendedorTieneDatos = values.vendedor &&
    [values.vendedor.nombre, values.vendedor.apellido, values.vendedor.cedula,
     values.vendedor.telefono, values.vendedor.provincia, values.vendedor.municipio, values.vendedor.sector]
      .some((v) => v && v.trim().length > 0)

  const filas = vendedorTieneDatos
    ? [
        compradorRow,
        {
          matricula_id,
          rol: 'vendedor',
          ...values.vendedor,
          nombre: values.vendedor!.nombre || '',
          apellido: values.vendedor!.apellido || '',
          cedula: values.vendedor!.cedula || null,
          telefono: values.vendedor!.telefono || null,
          provincia: values.vendedor!.provincia || null,
          municipio: values.vendedor!.municipio || null,
          sector: values.vendedor!.sector || null,
        },
      ]
    : [compradorRow]

  // Insertar comprador (y vendedor si tiene datos)
  await supabase
    .schema(SCHEMA as 'public')
    .from('personas' as never)
    .insert(filas as never)

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

  return { id: matricula_id }
}

export async function actualizarMatricula(
  id: string,
  values: Partial<MatriculaFormValues>
) {
  const supabase = await createSupabaseServer()
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
        provincia: values.comprador.provincia || null,
        municipio: values.comprador.municipio || null,
        sector: values.comprador.sector || null,
      } as never)
      .eq('matricula_id' as never, id)
      .eq('rol' as never, 'comprador')
  }

  if (values.vendedor) {
    const vendTieneDatos = [values.vendedor.nombre, values.vendedor.apellido,
      values.vendedor.cedula, values.vendedor.telefono,
      values.vendedor.provincia, values.vendedor.municipio, values.vendedor.sector]
        .some((v) => v && v.trim().length > 0)

    if (vendTieneDatos) {
      // Verificar si ya existe fila de vendedor
      const { data: existente } = await supabase
        .schema(SCHEMA as 'public')
        .from('personas' as never)
        .select('id')
        .eq('matricula_id' as never, id)
        .eq('rol' as never, 'vendedor')
        .maybeSingle()

      const vendedorPayload = {
        matricula_id: id,
        rol: 'vendedor',
        nombre: values.vendedor.nombre || '',
        apellido: values.vendedor.apellido || '',
        cedula: values.vendedor.cedula || null,
        telefono: values.vendedor.telefono || null,
        direccion: values.vendedor.direccion || null,
        provincia: values.vendedor.provincia || null,
        municipio: values.vendedor.municipio || null,
        sector: values.vendedor.sector || null,
      }

      if (existente) {
        await supabase
          .schema(SCHEMA as 'public')
          .from('personas' as never)
          .update(vendedorPayload as never)
          .eq('matricula_id' as never, id)
          .eq('rol' as never, 'vendedor')
      } else {
        await supabase
          .schema(SCHEMA as 'public')
          .from('personas' as never)
          .insert(vendedorPayload as never)
      }
    }
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
  const supabase = await createSupabaseServer()
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
  const supabase = await createSupabaseServer()
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
  const supabase = await createSupabaseServer()
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
  const supabase = await createSupabaseServer()
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
  const supabase = await createSupabaseServer()
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
  const supabase = await createSupabaseServer()
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
  const supabase = await createSupabaseServer()
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

export async function crearNota(matriculaId: string, contenido: string) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA as 'public')
    .from('notas' as never)
    .insert({
      matricula_id: matriculaId,
      contenido: contenido.trim(),
      autor_nombre: user?.email ?? null,
    } as never)

  revalidatePath(`/matriculas/${matriculaId}`)
}

export async function cambiarEtapaMasivo(ids: string[], etapa: Etapa) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA as 'public')
    .from('matriculas' as never)
    .update({
      etapa,
      updated_by: user?.id ?? null,
    } as never)
    .in('id' as never, ids as never)

  for (const id of ids) {
    await registrarHistorial(
      supabase,
      id,
      'cambio_etapa',
      `Etapa actualizada masivamente a: ${etapa}`,
      user?.email
    )
  }

  revalidatePath('/matriculas')
  revalidatePath('/')
}

export async function snoozeAlerta(
  matriculaId: string,
  tipoAlerta: string
) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const snoozeUntil = new Date()
  snoozeUntil.setDate(snoozeUntil.getDate() + 3)

  // Delete existing snooze for this matricula+tipo and insert new one
  await supabase
    .schema(SCHEMA as 'public')
    .from('alertas_snooze' as never)
    .delete()
    .eq('matricula_id' as never, matriculaId)
    .eq('tipo_alerta' as never, tipoAlerta)

  await supabase
    .schema(SCHEMA as 'public')
    .from('alertas_snooze' as never)
    .insert({
      matricula_id: matriculaId,
      tipo_alerta: tipoAlerta,
      snooze_until: snoozeUntil.toISOString(),
      created_by: user?.email ?? null,
    } as never)

  revalidatePath('/alertas')
  revalidatePath('/')
}
