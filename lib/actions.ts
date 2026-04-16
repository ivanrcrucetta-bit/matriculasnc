'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { calcularEtapa } from '@/lib/pipeline'
import { formatISO } from '@/lib/fecha'
import type { MatriculaFormValues } from '@/lib/validations'
import type { Documento, Etapa, Matricula, TipoDocumento, TipoEvento } from '@/types'

const SCHEMA = 'matriculas'

async function generarCodigo(): Promise<string> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.schema(SCHEMA).rpc('generar_codigo')
  if (!error && data) return data as string

  // Fallback: si falla la RPC (permiso, red) calculamos en JS. No es atómico
  // pero la colisión se captura por el UNIQUE en matriculas.codigo y se
  // reintenta en `crearMatricula`.
  const año = new Date().getFullYear()
  const { data: rows } = await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .select('codigo')
    .like('codigo', `NC-${año}-%`)
    .order('codigo', { ascending: false })
    .limit(1)

  const ultimo =
    rows && rows.length > 0 ? parseInt(rows[0].codigo.split('-')[2]) || 0 : 0

  return `NC-${año}-${String(ultimo + 1).padStart(3, '0')}`
}

async function registrarHistorial(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  matricula_id: string,
  tipo_evento: TipoEvento,
  descripcion: string,
  usuario_nombre?: string
) {
  await supabase.schema(SCHEMA).from('historial').insert({
    matricula_id,
    tipo_evento,
    descripcion,
    usuario_nombre: usuario_nombre ?? null,
  })
}

async function sincronizarEtapa(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  matriculaId: string
) {
  const { data: mat } = await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .select('*')
    .eq('id', matriculaId)
    .single()

  const { data: docs } = await supabase
    .schema(SCHEMA)
    .from('documentos')
    .select('tipo')
    .eq('matricula_id', matriculaId)

  if (!mat) return

  const matricula = mat as Matricula
  const documentos = (docs ?? []) as Pick<Documento, 'tipo'>[]

  const nuevaEtapa = calcularEtapa(matricula, documentos as Documento[])

  if (nuevaEtapa !== matricula.etapa) {
    await supabase
      .schema(SCHEMA)
      .from('matriculas')
      .update({ etapa: nuevaEtapa })
      .eq('id', matriculaId)

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

  // Inserta con reintentos ante colisión del codigo unico. La RPC ya usa
  // pg_advisory_xact_lock, pero la generación + insert ocurren en
  // transacciones distintas (RPC -> insert), así que dejamos una red de
  // seguridad con regeneración del código.
  const MAX_INTENTOS = 3
  let codigo = values.codigo || (await generarCodigo())
  let mat: { id: string } | null = null
  let lastErr: { message: string; code?: string } | null = null

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('matriculas')
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
      })
      .select('id')
      .single()

    if (!error && data) {
      mat = data as { id: string }
      break
    }

    lastErr = error as { message: string; code?: string } | null
    const esColisionCodigo =
      error?.code === '23505' && /codigo/i.test(error?.message ?? '')
    if (!esColisionCodigo || values.codigo) break

    codigo = await generarCodigo()
  }

  if (!mat) {
    throw new Error(lastErr?.message ?? 'Error al crear matrícula')
  }

  const { id: matricula_id } = mat

  const compradorRow = {
    matricula_id,
    rol: 'comprador' as const,
    nombre: values.comprador.nombre,
    apellido: values.comprador.apellido,
    cedula: values.comprador.cedula || null,
    telefono: values.comprador.telefono || null,
    direccion: values.comprador.direccion || null,
    provincia: values.comprador.provincia || null,
    municipio: values.comprador.municipio || null,
    sector: values.comprador.sector || null,
  }

  const vendedorTieneDatos =
    values.vendedor &&
    [
      values.vendedor.nombre,
      values.vendedor.apellido,
      values.vendedor.cedula,
      values.vendedor.telefono,
      values.vendedor.provincia,
      values.vendedor.municipio,
      values.vendedor.sector,
    ].some((v) => v && v.trim().length > 0)

  const filas = vendedorTieneDatos
    ? [
        compradorRow,
        {
          matricula_id,
          rol: 'vendedor' as const,
          nombre: values.vendedor!.nombre || '',
          apellido: values.vendedor!.apellido || '',
          cedula: values.vendedor!.cedula || null,
          telefono: values.vendedor!.telefono || null,
          direccion: values.vendedor!.direccion || null,
          provincia: values.vendedor!.provincia || null,
          municipio: values.vendedor!.municipio || null,
          sector: values.vendedor!.sector || null,
        },
      ]
    : [compradorRow]

  await supabase.schema(SCHEMA).from('personas').insert(filas)

  await registrarHistorial(
    supabase,
    matricula_id,
    'creacion',
    `Matrícula ${codigo} creada`,
    user?.email
  )

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Construye el update solo con campos provistos para no pisar con null
  // lo que no se está editando.
  type MatriculaUpdate = Parameters<
    ReturnType<typeof supabase.schema>['from']
  >[0] extends 'matriculas'
    ? object
    : object
  const update: Record<string, unknown> = {
    updated_by: user?.id ?? null,
  }

  if (values.placa !== undefined) update.placa = values.placa
  if (values.numero_credito !== undefined)
    update.numero_credito = values.numero_credito || null
  if (values.chasis !== undefined) update.chasis = values.chasis || null
  if (values.marca !== undefined) update.marca = values.marca || null
  if (values.modelo !== undefined) update.modelo = values.modelo || null
  if (values.año !== undefined) update.año = values.año ?? null
  if (values.color !== undefined) update.color = values.color || null
  if (values.lleva_traspaso !== undefined)
    update.lleva_traspaso = values.lleva_traspaso
  if (values.lleva_oposicion !== undefined)
    update.lleva_oposicion = values.lleva_oposicion
  if (values.notas !== undefined) update.notas = values.notas || null

  // `update` es dinámico (partial); el cliente tipado requiere un shape
  // conocido así que mantenemos un único cast controlado aquí.
  type _Unused = MatriculaUpdate
  await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .update(update as Record<string, never>)
    .eq('id', id)

  if (values.comprador) {
    await supabase
      .schema(SCHEMA)
      .from('personas')
      .update({
        nombre: values.comprador.nombre,
        apellido: values.comprador.apellido,
        cedula: values.comprador.cedula || null,
        telefono: values.comprador.telefono || null,
        direccion: values.comprador.direccion || null,
        provincia: values.comprador.provincia || null,
        municipio: values.comprador.municipio || null,
        sector: values.comprador.sector || null,
      })
      .eq('matricula_id', id)
      .eq('rol', 'comprador')
  }

  if (values.vendedor) {
    const vendTieneDatos = [
      values.vendedor.nombre,
      values.vendedor.apellido,
      values.vendedor.cedula,
      values.vendedor.telefono,
      values.vendedor.provincia,
      values.vendedor.municipio,
      values.vendedor.sector,
    ].some((v) => v && v.trim().length > 0)

    if (vendTieneDatos) {
      const { data: existente } = await supabase
        .schema(SCHEMA)
        .from('personas')
        .select('id')
        .eq('matricula_id', id)
        .eq('rol', 'vendedor')
        .maybeSingle()

      const vendedorPayload = {
        matricula_id: id,
        rol: 'vendedor' as const,
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
          .schema(SCHEMA)
          .from('personas')
          .update(vendedorPayload)
          .eq('matricula_id', id)
          .eq('rol', 'vendedor')
      } else {
        await supabase.schema(SCHEMA).from('personas').insert(vendedorPayload)
      }
    }
  }

  await registrarHistorial(
    supabase,
    id,
    'nota_agregada',
    'Datos de la matrícula actualizados',
    user?.email
  )
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.schema(SCHEMA).from('documentos').insert({
    matricula_id: matriculaId,
    tipo,
    nombre_archivo: storageInfo.nombre_archivo,
    storage_path: storageInfo.storage_path,
    subido_por: user?.id ?? null,
  })

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

export async function eliminarDocumento(
  matriculaId: string,
  documentoId: string,
  storagePath: string
) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase.storage.from('matriculas-docs').remove([storagePath])

  await supabase
    .schema(SCHEMA)
    .from('documentos')
    .delete()
    .eq('id', documentoId)

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .update({
      fecha_oposicion: formatISO(fecha),
      updated_by: user?.id ?? null,
    })
    .eq('id', matriculaId)

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .update({ fecha_oposicion: null, updated_by: user?.id ?? null })
    .eq('id', matriculaId)

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .update({
      fecha_traspaso: formatISO(fecha),
      etapa: 'traspaso_en_proceso',
      updated_by: user?.id ?? null,
    })
    .eq('id', matriculaId)

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .update({
      etapa: 'traspaso_completado',
      updated_by: user?.id ?? null,
    })
    .eq('id', matriculaId)

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .update({
      etapa: 'cerrado',
      updated_by: user?.id ?? null,
    })
    .eq('id', matriculaId)

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Tabla `notas` aún no existe en DB; se conserva el flujo pero fallará
  // hasta que se cree. Se mantiene el cast `as never` acotado aquí.
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .update({
      etapa,
      updated_by: user?.id ?? null,
    })
    .in('id', ids)

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

export async function snoozeAlerta(matriculaId: string, tipoAlerta: string) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const snoozeUntil = new Date()
  snoozeUntil.setDate(snoozeUntil.getDate() + 3)

  // Tabla `alertas_snooze` aún no existe en DB; casts acotados aquí.
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
