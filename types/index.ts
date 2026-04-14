export type Etapa =
  | 'registrada'
  | 'docs_pendientes'
  | 'docs_completos'
  | 'oposicion_pendiente'
  | 'oposicion_puesta'
  | 'traspaso_en_proceso'
  | 'traspaso_completado'
  | 'cerrado'

export type RolPersona = 'comprador' | 'vendedor'

export type TipoDocumento =
  | 'copia_matricula'
  | 'cedula_comprador'
  | 'cedula_vendedor'
  | 'contrato_venta'
  | 'fotocopia_matricula_vigente'
  | 'comprobante_dgii'
  | 'carta_credito'
  | 'certificado_deuda'
  | 'poder_notarial'
  | 'carta_no_objecion'
  | 'contrato_prenda'
  | 'otro'

export type TipoEvento =
  | 'creacion'
  | 'cambio_etapa'
  | 'documento_subido'
  | 'documento_eliminado'
  | 'oposicion_registrada'
  | 'oposicion_retirada'
  | 'traspaso_iniciado'
  | 'traspaso_completado'
  | 'nota_agregada'
  | 'cierre'

export interface Matricula {
  id: string
  codigo: string
  numero_credito: string | null
  placa: string | null
  chasis: string | null
  marca: string | null
  modelo: string | null
  año: number | null
  color: string | null
  lleva_traspaso: boolean
  lleva_oposicion: boolean
  etapa: Etapa
  fecha_oposicion: string | null
  fecha_traspaso: string | null
  notas: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface Persona {
  id: string
  matricula_id: string
  rol: RolPersona
  nombre: string
  apellido: string
  cedula: string | null
  telefono: string | null
  direccion: string | null
  created_at: string
}

export interface Documento {
  id: string
  matricula_id: string
  tipo: TipoDocumento
  nombre_archivo: string
  storage_path: string
  subido_por: string | null
  created_at: string
}

export interface EventoHistorial {
  id: string
  matricula_id: string
  tipo_evento: TipoEvento
  descripcion: string
  usuario_nombre: string | null
  created_at: string
}

// Resumen de documento para uso en listas (sin cargar todos los campos)
export interface DocResumen {
  tipo: TipoDocumento
  storage_path: string
  nombre_archivo: string
}

// Tipo compuesto para listados y kanban
export interface MatriculaConPersonas extends Matricula {
  personas: Persona[]
}

// Tipo completo para el detalle
export interface MatriculaDetalle extends Matricula {
  personas: Persona[]
  documentos: Documento[]
  historial: EventoHistorial[]
}

export interface EtapaInfo {
  etapa: Etapa
  label: string
  descripcion: string
  color: 'gray' | 'amber' | 'blue' | 'orange' | 'green' | 'teal' | 'emerald' | 'slate'
}

export const ETAPA_INFO: Record<Etapa, EtapaInfo> = {
  registrada: {
    etapa: 'registrada',
    label: 'Registrada',
    descripcion: 'Matrícula creada en el sistema',
    color: 'gray',
  },
  docs_pendientes: {
    etapa: 'docs_pendientes',
    label: 'Docs. Pendientes',
    descripcion: 'Faltan documentos obligatorios',
    color: 'amber',
  },
  docs_completos: {
    etapa: 'docs_completos',
    label: 'Docs. Completos',
    descripcion: 'Todos los documentos están listos',
    color: 'blue',
  },
  oposicion_pendiente: {
    etapa: 'oposicion_pendiente',
    label: 'Oposición Pendiente',
    descripcion: 'Pendiente de poner oposición en Tránsito',
    color: 'orange',
  },
  oposicion_puesta: {
    etapa: 'oposicion_puesta',
    label: 'Oposición Puesta',
    descripcion: 'Oposición registrada en Tránsito',
    color: 'green',
  },
  traspaso_en_proceso: {
    etapa: 'traspaso_en_proceso',
    label: 'Traspaso en Proceso',
    descripcion: 'Traspaso del vehículo en trámite',
    color: 'teal',
  },
  traspaso_completado: {
    etapa: 'traspaso_completado',
    label: 'Traspaso Completado',
    descripcion: 'Traspaso del vehículo completado',
    color: 'emerald',
  },
  cerrado: {
    etapa: 'cerrado',
    label: 'Cerrado',
    descripcion: 'Caso cerrado',
    color: 'slate',
  },
}

// Composite types for people directory
export interface PersonaConMatriculas extends Persona {
  matriculas: Array<{
    id: string
    codigo: string
    etapa: Etapa
    placa: string | null
    rol: RolPersona
  }>
}

// Nota interna
export interface Nota {
  id: string
  matricula_id: string
  contenido: string
  autor_nombre: string | null
  created_at: string
}

// Alerta con severidad
export type SeveridadAlerta = 'critica' | 'media' | 'baja'

export interface AlertaSeveridad {
  id: string
  matricula_id: string
  codigo: string
  placa: string | null
  comprador: string
  tipo: 'sin_docs' | 'oposicion_pendiente' | 'traspaso_lento' | 'sin_actividad'
  descripcion: string
  diasTranscurridos: number
  severidad: SeveridadAlerta
  updated_at: string
}

// Credit linking
export interface CreditoInfo {
  numero_credito: string
  estado: string | null
  oficial: string | null
}

export const ETAPAS_ORDEN: Etapa[] = [
  'registrada',
  'docs_pendientes',
  'docs_completos',
  'oposicion_pendiente',
  'oposicion_puesta',
  'traspaso_en_proceso',
  'traspaso_completado',
  'cerrado',
]

export const TIPO_DOC_LABELS: Record<TipoDocumento, string> = {
  copia_matricula: 'Copia Matrícula',
  cedula_comprador: 'Cédula Cliente',
  cedula_vendedor: 'Cédula Vendedor',
  contrato_venta: 'Contrato de Venta',
  fotocopia_matricula_vigente: 'Fotocopia Matrícula Vigente',
  comprobante_dgii: 'Comprobante DGII',
  carta_credito: 'Carta de Crédito',
  certificado_deuda: 'Certificado de Deuda',
  poder_notarial: 'Poder Notarial',
  carta_no_objecion: 'Carta de No Objeción',
  contrato_prenda: 'Contrato de Prenda',
  otro: 'Otro',
}

export const TIPO_EVENTO_LABELS: Record<TipoEvento, string> = {
  creacion: 'Creación',
  cambio_etapa: 'Cambio de Etapa',
  documento_subido: 'Documento Subido',
  documento_eliminado: 'Documento Eliminado',
  oposicion_registrada: 'Oposición Registrada',
  oposicion_retirada: 'Oposición Retirada',
  traspaso_iniciado: 'Traspaso Iniciado',
  traspaso_completado: 'Traspaso Completado',
  nota_agregada: 'Nota Agregada',
  cierre: 'Caso Cerrado',
}
