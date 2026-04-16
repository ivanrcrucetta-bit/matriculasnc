'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { crearUploadQueue, type UploadItem } from '@/lib/upload-queue'
import { procesarImagen, esImagen } from '@/lib/imagen-canvas'
import { crearSignedUploadUrl } from '@/lib/actions-docs'
import type { TipoDocumento } from '@/types'

export interface UploaderOptions {
  matriculaId: string | null
  onItemCompletado?: (item: UploadItem) => void
}

/**
 * Hook orquestador del uploader. Inicializa la cola solo cuando tenemos
 * matriculaId (en modo crear, empieza diferido hasta después de crearMatricula).
 */
export function useDocumentoUploader(opts: UploaderOptions) {
  const { matriculaId, onItemCompletado } = opts
  const [items, setItems] = useState<UploadItem[]>([])
  const itemsRef = useRef<UploadItem[]>([])
  const matriculaIdRef = useRef(matriculaId)
  const completadosRef = useRef<Set<string>>(new Set())
  // Guardamos el callback en una ref para que el efecto de suscripción
  // no se vuelva a ejecutar cada vez que el padre pasa una función nueva
  // (evita bucle infinito de setState).
  const onCompletadoRef = useRef(onItemCompletado)

  useEffect(() => {
    matriculaIdRef.current = matriculaId
  }, [matriculaId])

  useEffect(() => {
    onCompletadoRef.current = onItemCompletado
  })

  const queue = useMemo(
    () =>
      crearUploadQueue({
        concurrency: 3,
        maxAttempts: 3,
        procesarFile: async (item) => {
          const f = item.file
          if (!esImagen(f)) return f
          return procesarImagen(f, { tipo: item.tipo })
        },
        obtenerSignedUrl: async (item) => {
          const mid = matriculaIdRef.current
          if (!mid)
            throw new Error(
              'Matrícula aún no creada — no se puede subir documento'
            )
          const res = await crearSignedUploadUrl({
            matriculaId: mid,
            tipo: item.tipo,
            nombreArchivo: item.file.name,
            mime: item.file.type,
            size: item.file.size,
          })
          if (!res.ok) throw new Error(res.error)
          return { path: res.path, token: res.token, url: res.url }
        },
      }),
    []
  )

  useEffect(() => {
    const unsubscribe = queue.subscribe((snap) => {
      itemsRef.current = snap
      setItems(snap)
      const cb = onCompletadoRef.current
      if (!cb) return
      snap.forEach((it) => {
        if (it.status === 'done' && !completadosRef.current.has(it.id)) {
          completadosRef.current.add(it.id)
          cb(it)
        }
      })
    })
    return unsubscribe
  }, [queue])

  const agregarArchivos = useCallback(
    (tipo: TipoDocumento, files: File[]) => {
      files.forEach((f) => queue.agregar(tipo, f))
    },
    [queue]
  )

  const eliminar = useCallback((id: string) => queue.eliminar(id), [queue])
  const reintentar = useCallback((id: string) => queue.reintentar(id), [queue])
  const cancelar = useCallback((id: string) => queue.cancelar(id), [queue])
  const cambiarTipo = useCallback(
    (id: string, tipo: TipoDocumento) => queue.cambiarTipo(id, tipo),
    [queue]
  )

  const esperarTodos = useCallback(() => queue.esperarTodos(), [queue])

  return {
    items,
    agregarArchivos,
    eliminar,
    reintentar,
    cancelar,
    cambiarTipo,
    esperarTodos,
  }
}
