import type { TipoDocumento } from '@/types'

export interface TipoDocumentoInfo {
  label: string
  shortLabel: string
  descripcion: string
  color: string
  bgColor: string
  textColor: string
  requerido: boolean
}

export const TIPO_DOCUMENTO_INFO: Record<TipoDocumento, TipoDocumentoInfo> = {
  copia_matricula: {
    label: 'Copia Matrícula',
    shortLabel: 'Matr.',
    descripcion: 'Copia del título de propiedad del vehículo',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    requerido: true,
  },
  cedula_comprador: {
    label: 'Cédula Cliente',
    shortLabel: 'Ced. C',
    descripcion: 'Cédula de identidad del comprador',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    requerido: true,
  },
  cedula_vendedor: {
    label: 'Cédula Vendedor',
    shortLabel: 'Ced. V',
    descripcion: 'Cédula de identidad del vendedor',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    requerido: true,
  },
  contrato_venta: {
    label: 'Contrato de Venta',
    shortLabel: 'Contrato',
    descripcion: 'Contrato de compraventa del vehículo',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    requerido: false,
  },
  fotocopia_matricula_vigente: {
    label: 'Fotocopia Matrícula Vigente',
    shortLabel: 'Matr. Vig.',
    descripcion: 'Fotocopia de la matrícula vigente del vehículo',
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    requerido: false,
  },
  comprobante_dgii: {
    label: 'Comprobante DGII',
    shortLabel: 'DGII',
    descripcion: 'Comprobante fiscal de la DGII',
    color: 'amber',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    requerido: false,
  },
  carta_credito: {
    label: 'Carta de Crédito',
    shortLabel: 'Carta Créd.',
    descripcion: 'Carta de crédito emitida por la institución financiera',
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    requerido: false,
  },
  certificado_deuda: {
    label: 'Certificado de Deuda',
    shortLabel: 'Cert. Deuda',
    descripcion: 'Certificado de deuda del vehículo',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    requerido: false,
  },
  poder_notarial: {
    label: 'Poder Notarial',
    shortLabel: 'Poder Not.',
    descripcion: 'Poder notarial para representación legal',
    color: 'violet',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    requerido: false,
  },
  carta_no_objecion: {
    label: 'Carta de No Objeción',
    shortLabel: 'No Objeción',
    descripcion: 'Carta de no objeción para el traspaso',
    color: 'teal',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    requerido: false,
  },
  contrato_prenda: {
    label: 'Contrato de Prenda',
    shortLabel: 'Prenda',
    descripcion: 'Contrato de prenda del vehículo',
    color: 'rose',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    requerido: false,
  },
  otro: {
    label: 'Otro',
    shortLabel: 'Otro',
    descripcion: 'Documento adicional',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    requerido: false,
  },
}

export const TIPOS_REQUERIDOS: TipoDocumento[] = Object.entries(TIPO_DOCUMENTO_INFO)
  .filter(([, info]) => info.requerido)
  .map(([tipo]) => tipo as TipoDocumento)

export const TODOS_LOS_TIPOS: TipoDocumento[] = Object.keys(TIPO_DOCUMENTO_INFO) as TipoDocumento[]

export const TIPOS_ADICIONALES: TipoDocumento[] = TODOS_LOS_TIPOS.filter(
  (t) => !TIPOS_REQUERIDOS.includes(t)
)
