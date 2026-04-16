import type { Etapa, Matricula, Documento, TipoDocumento } from '@/types'

// Documentos obligatorios para avanzar de la fase de documentación
const DOCS_OBLIGATORIOS: TipoDocumento[] = [
  'copia_matricula',
  'cedula_comprador',
  'cedula_vendedor',
]

/**
 * Retorna los bloqueos que impiden cerrar el caso.
 * Cada bloqueo es una descripción legible de qué falta.
 */
export function calcularBloqueos(
  matricula: Matricula,
  documentos: Documento[]
): string[] {
  const bloqueos: string[] = []
  const tipos = documentos.map((d) => d.tipo)

  if (!tipos.includes('copia_matricula')) bloqueos.push('Falta copia de matrícula')
  if (!tipos.includes('cedula_comprador')) bloqueos.push('Falta cédula del cliente')
  if (!tipos.includes('cedula_vendedor')) bloqueos.push('Falta cédula del vendedor')
  if (matricula.lleva_oposicion && !matricula.fecha_oposicion)
    bloqueos.push('Oposición no registrada')
  if (matricula.lleva_traspaso && matricula.etapa !== 'traspaso_completado' && matricula.etapa !== 'cerrado')
    bloqueos.push('Traspaso no completado')

  return bloqueos
}

/**
 * Calcula la etapa correcta según el estado actual de la matrícula.
 *
 * Máquina de estados (en orden de prioridad):
 * 1. cerrado → no recalcular (solo la acción manual puede llegar aquí)
 * 2. traspaso_completado → etapa previa al cierre
 * 3. traspaso_en_proceso → si está en traspaso activo
 * 4. oposicion_puesta → docs completos + oposicion puesta (y lleva_traspaso pero aún no inicia)
 * 5. oposicion_pendiente → docs completos + requiere oposicion sin fecha
 * 6. docs_completos → docs obligatorios presentes, sin requerir oposicion o ya resuelta
 * 7. docs_pendientes → faltan documentos
 * 8. registrada → estado inicial
 *
 * El traspaso no se infiere automáticamente desde fechas; se activa mediante
 * la acción explícita "Iniciar traspaso" que escribe etapa='traspaso_en_proceso'.
 * Solo traspaso_completado se recalcula aquí cuando corresponde.
 */
export function calcularEtapa(
  matricula: Matricula,
  documentos: Documento[]
): Etapa {
  const { lleva_oposicion, lleva_traspaso, etapa: etapaActual } = matricula
  const tipos = documentos.map((d) => d.tipo)

  const docsCompletos = DOCS_OBLIGATORIOS.every((tipo) => tipos.includes(tipo))

  // Entrega es terminal y gana sobre todo: si el caso quedó registrado como
  // entregado, se mantiene ahí mientras exista fecha_entrega.
  if (matricula.fecha_entrega) return 'entregada'

  // El estado cerrado es definitivo; no se recalcula automáticamente.
  if (etapaActual === 'cerrado') return 'cerrado'

  // Si está explícitamente en traspaso_en_proceso (escrito por acción manual)
  // respetar ese estado a menos que el traspaso esté completo.
  if (etapaActual === 'traspaso_en_proceso') return 'traspaso_en_proceso'
  if (etapaActual === 'traspaso_completado') return 'traspaso_completado'

  if (!docsCompletos) {
    // Si no tiene ningún documento todavía vuelve a registrada inicial,
    // de lo contrario muestra que está en proceso de juntar docs.
    const tienAlgunDoc = tipos.length > 0
    return tienAlgunDoc ? 'docs_pendientes' : 'registrada'
  }

  // Docs completos a partir de aquí
  if (lleva_oposicion && !matricula.fecha_oposicion) {
    return 'oposicion_pendiente'
  }

  if (lleva_oposicion && matricula.fecha_oposicion) {
    if (!lleva_traspaso) return 'oposicion_puesta'
    // Tiene oposicion pero traspaso aún no iniciado
    return 'oposicion_puesta'
  }

  // Sin oposición o con oposición resuelta — siguiente fase es traspaso
  if (lleva_traspaso) {
    // Traspaso no iniciado aún (acción pendiente del usuario)
    return 'docs_completos'
  }

  // Sin oposición y sin traspaso: docs completos es el estado final antes de cerrar
  return 'docs_completos'
}

/**
 * Retorna las etapas visibles en el PipelineIndicator para una matrícula dada,
 * omitiendo las que no aplican según sus flags.
 */
export function etapasVisibles(matricula: Matricula): Etapa[] {
  const todas: Etapa[] = [
    'registrada',
    'docs_pendientes',
    'docs_completos',
  ]

  if (matricula.lleva_oposicion) {
    todas.push('oposicion_pendiente', 'oposicion_puesta')
  }

  if (matricula.lleva_traspaso) {
    todas.push('traspaso_en_proceso', 'traspaso_completado')
  }

  todas.push('cerrado', 'entregada')
  return todas
}

/**
 * Índice de la etapa actual en la lista de etapas visibles.
 * Útil para colorear la barra de progreso.
 */
export function indicePorcentajeEtapa(
  matricula: Matricula,
  etapa: Etapa
): number {
  const visibles = etapasVisibles(matricula)
  const idx = visibles.indexOf(etapa)
  return idx === -1 ? 0 : Math.round((idx / (visibles.length - 1)) * 100)
}
