'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase-server'
import { calcularEtapa } from '@/lib/pipeline'
import { buildDocPath, nombreArchivoLimpio } from '@/lib/storage-paths'
import type { Documento, Matricula, TipoDocumento } from '@/types'

const SCHEMA = 'matriculas'
const BUCKET = 'matriculas-docs'

const MIME_PERMITIDOS = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const TAMAÑO_MAX_BYTES = 10 * 1024 * 1024 // 10 MB

// ---------------------------------------------------------------------------
// Signed upload URLs (para subir desde el cliente con progreso real via XHR)
// ---------------------------------------------------------------------------

export interface SignedUploadInput {
  matriculaId: string
  tipo: TipoDocumento
  nombreArchivo: string
  mime: string
  size: number
}

export interface SignedUploadResult {
  ok: true
  path: string
  token: string
  url: string
  nombreSanitizado: string
}

export interface SignedUploadError {
  ok: false
  error: string
}

/**
 * Crea una URL firmada para subir directamente a Supabase Storage.
 * Valida tamaño y mime ANTES de emitir el token, no confía en el cliente.
 */
export async function crearSignedUploadUrl(
  input: SignedUploadInput
): Promise<SignedUploadResult | SignedUploadError> {
  if (!MIME_PERMITIDOS.has(input.mime)) {
    return { ok: false, error: `Tipo de archivo no permitido: ${input.mime}` }
  }
  if (input.size > TAMAÑO_MAX_BYTES) {
    return { ok: false, error: 'El archivo supera 10 MB' }
  }
  if (!input.matriculaId || !input.tipo) {
    return { ok: false, error: 'Faltan datos requeridos' }
  }

  const supabase = await createSupabaseServer()
  const path = buildDocPath({
    matriculaId: input.matriculaId,
    tipo: input.tipo,
    file: { name: input.nombreArchivo, type: input.mime },
  })

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo firmar la subida' }
  }

  return {
    ok: true,
    path,
    token: data.token,
    url: data.signedUrl,
    nombreSanitizado: nombreArchivoLimpio(input.nombreArchivo),
  }
}

// ---------------------------------------------------------------------------
// Commit batch: registra N documentos ya subidos en una sola transacción
// ---------------------------------------------------------------------------

export interface CommitDocumentoItem {
  tipo: TipoDocumento
  nombre_archivo: string
  storage_path: string
  size: number
  mime: string
}

export interface CommitResult {
  ok: boolean
  insertados: number
  error?: string
}

export async function commitDocumentos(
  matriculaId: string,
  items: CommitDocumentoItem[]
): Promise<CommitResult> {
  if (!items.length) return { ok: true, insertados: 0 }

  for (const it of items) {
    if (!MIME_PERMITIDOS.has(it.mime)) {
      return { ok: false, insertados: 0, error: `Mime inválido: ${it.mime}` }
    }
    if (it.size > TAMAÑO_MAX_BYTES) {
      return { ok: false, insertados: 0, error: 'Archivo supera 10 MB' }
    }
  }

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const rows = items.map((it) => ({
    matricula_id: matriculaId,
    tipo: it.tipo,
    nombre_archivo: nombreArchivoLimpio(it.nombre_archivo),
    storage_path: it.storage_path,
    subido_por: user?.id ?? null,
  }))

  const { error: insertErr } = await supabase
    .schema(SCHEMA)
    .from('documentos')
    .insert(rows)

  if (insertErr) {
    return { ok: false, insertados: 0, error: insertErr.message }
  }

  // Un solo evento de historial resumen
  await supabase
    .schema(SCHEMA)
    .from('historial')
    .insert({
      matricula_id: matriculaId,
      tipo_evento: 'documento_subido',
      descripcion:
        items.length === 1
          ? `Documento subido: ${rows[0].nombre_archivo}`
          : `${items.length} documentos subidos`,
      usuario_nombre: user?.email ?? null,
    })

  // Sincronizar etapa una sola vez
  await sincronizarEtapa(supabase, matriculaId)

  revalidatePath(`/matriculas/${matriculaId}`)
  revalidatePath('/matriculas')
  revalidatePath('/')

  return { ok: true, insertados: items.length }
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
  const documentos = (docs ?? []) as Documento[]
  const nuevaEtapa = calcularEtapa(matricula, documentos)
  if (nuevaEtapa !== matricula.etapa) {
    await supabase
      .schema(SCHEMA)
      .from('matriculas')
      .update({ etapa: nuevaEtapa })
      .eq('id', matriculaId)

    await supabase
      .schema(SCHEMA)
      .from('historial')
      .insert({
        matricula_id: matriculaId,
        tipo_evento: 'cambio_etapa',
        descripcion: `Etapa actualizada a: ${nuevaEtapa}`,
        usuario_nombre: null,
      })
  }
}

// ---------------------------------------------------------------------------
// Firmado en lote para previsualización
// ---------------------------------------------------------------------------

export interface SignedUrlsResult {
  urls: Record<string, string>
  errores: string[]
}

/**
 * Firma N storage_paths en una sola ida y vuelta.
 * Retorna un mapa path → signedUrl. Paths que fallan quedan ausentes del mapa.
 */
export async function firmarUrlsLote(
  paths: string[],
  opts: {
    expiresIn?: number
    transform?: {
      width?: number
      height?: number
      resize?: 'cover' | 'contain' | 'fill'
      quality?: number
    }
  } = {}
): Promise<SignedUrlsResult> {
  if (!paths.length) return { urls: {}, errores: [] }
  const supabase = await createSupabaseServer()

  const expiresIn = opts.expiresIn ?? 3600

  // createSignedUrls no acepta transform en versión batch, hacemos pedidos
  // en paralelo cuando hay transformación, en lote cuando no.
  if (opts.transform) {
    const urls: Record<string, string> = {}
    const errores: string[] = []
    const resultados = await Promise.all(
      paths.map((p) =>
        supabase.storage
          .from(BUCKET)
          .createSignedUrl(p, expiresIn, { transform: opts.transform })
      )
    )
    resultados.forEach((r, i) => {
      if (r.data?.signedUrl) urls[paths[i]] = r.data.signedUrl
      else if (r.error) errores.push(`${paths[i]}: ${r.error.message}`)
    })
    return { urls, errores }
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresIn)

  const urls: Record<string, string> = {}
  const errores: string[] = []
  if (error) errores.push(error.message)
  data?.forEach((r) => {
    if (r.signedUrl && r.path) urls[r.path] = r.signedUrl
    else if (r.error) errores.push(`${r.path}: ${r.error}`)
  })
  return { urls, errores }
}

// ---------------------------------------------------------------------------
// Detección de duplicados (usado en Fase 1)
// ---------------------------------------------------------------------------

export interface DuplicadoMatricula {
  id: string
  codigo: string
  placa: string | null
  chasis: string | null
  numero_credito: string | null
  etapa: string
  coincide_por: Array<'placa' | 'chasis' | 'numero_credito'>
}

export async function buscarDuplicados(input: {
  placa?: string
  chasis?: string
  numero_credito?: string
  excluirId?: string
}): Promise<DuplicadoMatricula[]> {
  const supabase = await createSupabaseServer()
  const filtros: Array<{ campo: 'placa' | 'chasis' | 'numero_credito'; valor: string }> = []
  if (input.placa && input.placa.trim()) filtros.push({ campo: 'placa', valor: input.placa.trim() })
  if (input.chasis && input.chasis.trim())
    filtros.push({ campo: 'chasis', valor: input.chasis.trim() })
  if (input.numero_credito && input.numero_credito.trim())
    filtros.push({ campo: 'numero_credito', valor: input.numero_credito.trim() })
  if (!filtros.length) return []

  const or = filtros.map((f) => `${f.campo}.eq.${f.valor}`).join(',')
  const { data } = await supabase
    .schema(SCHEMA)
    .from('matriculas')
    .select('id,codigo,placa,chasis,numero_credito,etapa')
    .or(or)
    .limit(10)

  const rows = (data ?? []) as Array<{
    id: string
    codigo: string
    placa: string | null
    chasis: string | null
    numero_credito: string | null
    etapa: string
  }>

  return rows
    .filter((r) => r.id !== input.excluirId)
    .map((r) => {
      const coincide: DuplicadoMatricula['coincide_por'] = []
      if (input.placa && r.placa === input.placa.trim()) coincide.push('placa')
      if (input.chasis && r.chasis === input.chasis.trim()) coincide.push('chasis')
      if (input.numero_credito && r.numero_credito === input.numero_credito.trim())
        coincide.push('numero_credito')
      return { ...r, coincide_por: coincide }
    })
}
