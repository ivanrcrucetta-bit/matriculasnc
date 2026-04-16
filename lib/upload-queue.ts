import type { TipoDocumento } from '@/types'

/**
 * Cola de uploads con:
 *  - estado por ítem (procesando, subiendo, listo, error)
 *  - paralelismo limitado (sin dependencias externas)
 *  - reintentos exponenciales
 *  - progreso real vía XHR a signed upload URLs de Supabase
 */

export type UploadStatus =
  | 'pending'
  | 'processing'
  | 'uploading'
  | 'done'
  | 'error'
  | 'cancelled'

export interface UploadItem {
  id: string
  tipo: TipoDocumento
  file: File
  originalFile: File
  status: UploadStatus
  progress: number
  attempt: number
  error?: string
  storagePath?: string
  nombreArchivo?: string
}

export type Listener = (items: UploadItem[]) => void

export interface SignedUploadURL {
  path: string
  token: string
  url: string
}

export interface UploadQueueOptions {
  concurrency?: number
  maxAttempts?: number
  onChange?: Listener
  procesarFile: (item: UploadItem) => Promise<File>
  obtenerSignedUrl: (item: UploadItem) => Promise<SignedUploadURL>
}

export function crearUploadQueue(opts: UploadQueueOptions) {
  const {
    concurrency = 3,
    maxAttempts = 3,
    onChange,
    procesarFile,
    obtenerSignedUrl,
  } = opts

  const items = new Map<string, UploadItem>()
  const listeners = new Set<Listener>()
  if (onChange) listeners.add(onChange)

  let activos = 0
  const pendientes: string[] = []
  const xhrPorItem = new Map<string, XMLHttpRequest>()

  function snapshot(): UploadItem[] {
    return Array.from(items.values())
  }

  function emit() {
    const snap = snapshot()
    listeners.forEach((l) => l(snap))
  }

  function patch(id: string, patchObj: Partial<UploadItem>) {
    const actual = items.get(id)
    if (!actual) return
    items.set(id, { ...actual, ...patchObj })
    emit()
  }

  function agregar(tipo: TipoDocumento, file: File): UploadItem {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const item: UploadItem = {
      id,
      tipo,
      file,
      originalFile: file,
      status: 'pending',
      progress: 0,
      attempt: 0,
    }
    items.set(id, item)
    pendientes.push(id)
    emit()
    bombear()
    return item
  }

  function cambiarTipo(id: string, tipo: TipoDocumento) {
    const actual = items.get(id)
    if (!actual || actual.status === 'done' || actual.status === 'uploading')
      return
    patch(id, { tipo })
  }

  function eliminar(id: string) {
    const xhr = xhrPorItem.get(id)
    if (xhr) {
      xhr.abort()
      xhrPorItem.delete(id)
    }
    items.delete(id)
    const idx = pendientes.indexOf(id)
    if (idx >= 0) pendientes.splice(idx, 1)
    emit()
  }

  function reintentar(id: string) {
    const actual = items.get(id)
    if (!actual || actual.status !== 'error') return
    patch(id, { status: 'pending', progress: 0, error: undefined })
    pendientes.push(id)
    bombear()
  }

  function cancelar(id: string) {
    const xhr = xhrPorItem.get(id)
    if (xhr) xhr.abort()
    patch(id, { status: 'cancelled' })
  }

  async function procesar(id: string) {
    const actual = items.get(id)
    if (!actual) return
    try {
      patch(id, { status: 'processing', attempt: actual.attempt + 1 })
      const procesado = await procesarFile(actual)
      patch(id, { file: procesado })

      const signed = await obtenerSignedUrl({ ...actual, file: procesado })
      patch(id, {
        status: 'uploading',
        storagePath: signed.path,
        nombreArchivo: procesado.name,
      })

      await subirViaXHR(id, signed.url, procesado)

      patch(id, { status: 'done', progress: 100 })
    } catch (err) {
      const actualizado = items.get(id)
      const intento = actualizado?.attempt ?? 1
      const msg = err instanceof Error ? err.message : 'Error al subir'
      if (actualizado?.status === 'cancelled') return
      if (intento < maxAttempts) {
        const backoff = 400 * Math.pow(2, intento - 1)
        setTimeout(() => {
          patch(id, { status: 'pending', progress: 0, error: undefined })
          pendientes.push(id)
          bombear()
        }, backoff)
      } else {
        patch(id, { status: 'error', error: msg })
      }
    } finally {
      xhrPorItem.delete(id)
      activos = Math.max(0, activos - 1)
      bombear()
    }
  }

  function subirViaXHR(id: string, url: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhrPorItem.set(id, xhr)
      xhr.open('PUT', url, true)
      xhr.setRequestHeader(
        'Content-Type',
        file.type || 'application/octet-stream'
      )
      xhr.setRequestHeader('x-upsert', 'false')
      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return
        const pct = Math.round((ev.loaded / ev.total) * 100)
        patch(id, { progress: pct })
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`))
      }
      xhr.onerror = () => reject(new Error('Error de red al subir archivo'))
      xhr.onabort = () => reject(new Error('Subida cancelada'))
      xhr.send(file)
    })
  }

  function bombear() {
    while (activos < concurrency && pendientes.length > 0) {
      const id = pendientes.shift()!
      const item = items.get(id)
      if (!item || item.status === 'done' || item.status === 'cancelled')
        continue
      activos += 1
      procesar(id)
    }
  }

  async function esperarTodos(): Promise<UploadItem[]> {
    return new Promise((resolve) => {
      function check(snap: UploadItem[]) {
        const restantes = snap.filter(
          (i) => i.status !== 'done' && i.status !== 'error' && i.status !== 'cancelled'
        )
        if (restantes.length === 0) {
          listeners.delete(check)
          resolve(snap)
        }
      }
      listeners.add(check)
      check(snapshot())
    })
  }

  function subscribe(fn: Listener): () => void {
    listeners.add(fn)
    fn(snapshot())
    return () => {
      listeners.delete(fn)
    }
  }

  function clear() {
    xhrPorItem.forEach((xhr) => xhr.abort())
    xhrPorItem.clear()
    items.clear()
    pendientes.length = 0
    activos = 0
    emit()
  }

  return {
    agregar,
    eliminar,
    reintentar,
    cancelar,
    cambiarTipo,
    esperarTodos,
    subscribe,
    snapshot,
    clear,
  }
}

export type UploadQueue = ReturnType<typeof crearUploadQueue>
