import type { TipoDocumento } from '@/types'

/**
 * Heurística de detección automática del tipo de documento a partir del
 * nombre de archivo. Útil cuando el usuario arrastra varios PDFs/imágenes
 * de golpe con nombres tipo "cedula-juan.jpg" o "matricula_vigente.pdf".
 */

interface Regla {
  tipo: TipoDocumento
  patrones: RegExp[]
}

const REGLAS: Regla[] = [
  {
    tipo: 'cedula_comprador',
    patrones: [
      /cedula.*(comprador|cliente|compr)/i,
      /(comprador|cliente).*cedula/i,
      /ced.*cli/i,
    ],
  },
  {
    tipo: 'cedula_vendedor',
    patrones: [/cedula.*vendedor/i, /vendedor.*cedula/i, /ced.*vend/i],
  },
  {
    tipo: 'cedula_comprador',
    patrones: [/^cedula/i, /^ced[-_ ]/i],
  },
  {
    tipo: 'fotocopia_matricula_vigente',
    patrones: [/matricula.*(vigente|actual)/i, /matr.*vig/i],
  },
  {
    tipo: 'copia_matricula',
    patrones: [/copia.*matricula/i, /matricula/i, /matr(?!.*vig)/i],
  },
  {
    tipo: 'contrato_venta',
    patrones: [/contrato.*venta/i, /venta/i],
  },
  {
    tipo: 'contrato_prenda',
    patrones: [/prenda/i],
  },
  {
    tipo: 'comprobante_dgii',
    patrones: [/dgii/i, /comprobante.*fiscal/i],
  },
  {
    tipo: 'carta_credito',
    patrones: [/carta.*credito/i, /credito/i],
  },
  {
    tipo: 'certificado_deuda',
    patrones: [/certificado.*deuda/i, /cert.*deuda/i, /deuda/i],
  },
  {
    tipo: 'poder_notarial',
    patrones: [/poder/i, /notarial/i],
  },
  {
    tipo: 'carta_no_objecion',
    patrones: [/no.*objec/i, /objec/i],
  },
]

export function detectarTipoDocumento(nombre: string): TipoDocumento | null {
  const limpio = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const { tipo, patrones } of REGLAS) {
    if (patrones.some((p) => p.test(limpio))) return tipo
  }
  return null
}
