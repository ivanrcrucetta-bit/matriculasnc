/**
 * Tipado de la base de datos (schema `matriculas`).
 *
 * Escrito a mano porque `supabase gen types` en esta instalación solo exporta
 * el schema `public`. Este archivo refleja la estructura real consultada
 * sobre el schema `matriculas` y permite tipar el cliente Supabase sin
 * recurrir a casts `as never` por toda la aplicación.
 *
 * Si evolucionas el schema, actualiza este archivo en la misma PR.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Etapa =
  | 'registrada'
  | 'docs_pendientes'
  | 'docs_completos'
  | 'oposicion_pendiente'
  | 'oposicion_puesta'
  | 'traspaso_en_proceso'
  | 'traspaso_completado'
  | 'cerrado'
  | 'entregada'

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
  | 'acuse_entrega'
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
  | 'entrega_registrada'
  | 'nota_agregada'
  | 'cierre'

export interface MatriculasSchema {
  Tables: {
    matriculas: {
      Row: {
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
        fecha_entrega: string | null
        entregada_a_nombre: string | null
        entregada_a_cedula: string | null
        entregada_a_pasaporte: string | null
        notas: string | null
        created_at: string
        updated_at: string
        created_by: string | null
        updated_by: string | null
      }
      Insert: {
        id?: string
        codigo: string
        numero_credito?: string | null
        placa?: string | null
        chasis?: string | null
        marca?: string | null
        modelo?: string | null
        año?: number | null
        color?: string | null
        lleva_traspaso?: boolean
        lleva_oposicion?: boolean
        etapa?: Etapa
        fecha_oposicion?: string | null
        fecha_traspaso?: string | null
        fecha_entrega?: string | null
        entregada_a_nombre?: string | null
        entregada_a_cedula?: string | null
        entregada_a_pasaporte?: string | null
        notas?: string | null
        created_at?: string
        updated_at?: string
        created_by?: string | null
        updated_by?: string | null
      }
      Update: Partial<MatriculasSchema['Tables']['matriculas']['Insert']>
      Relationships: []
    }
    personas: {
      Row: {
        id: string
        matricula_id: string
        rol: RolPersona
        nombre: string
        apellido: string
        cedula: string | null
        pasaporte: string | null
        telefono: string | null
        direccion: string | null
        provincia: string | null
        municipio: string | null
        sector: string | null
        created_at: string
      }
      Insert: {
        id?: string
        matricula_id: string
        rol: RolPersona
        nombre: string
        apellido: string
        cedula?: string | null
        pasaporte?: string | null
        telefono?: string | null
        direccion?: string | null
        provincia?: string | null
        municipio?: string | null
        sector?: string | null
        created_at?: string
      }
      Update: Partial<MatriculasSchema['Tables']['personas']['Insert']>
      Relationships: []
    }
    documentos: {
      Row: {
        id: string
        matricula_id: string
        tipo: TipoDocumento
        nombre_archivo: string
        storage_path: string
        subido_por: string | null
        created_at: string
      }
      Insert: {
        id?: string
        matricula_id: string
        tipo: TipoDocumento
        nombre_archivo: string
        storage_path: string
        subido_por?: string | null
        created_at?: string
      }
      Update: Partial<MatriculasSchema['Tables']['documentos']['Insert']>
      Relationships: []
    }
    historial: {
      Row: {
        id: string
        matricula_id: string
        tipo_evento: TipoEvento
        descripcion: string
        usuario_nombre: string | null
        created_at: string
      }
      Insert: {
        id?: string
        matricula_id: string
        tipo_evento: TipoEvento
        descripcion: string
        usuario_nombre?: string | null
        created_at?: string
      }
      Update: Partial<MatriculasSchema['Tables']['historial']['Insert']>
      Relationships: []
    }
  }
  Views: Record<string, never>
  Functions: {
    generar_codigo: {
      Args: Record<string, never>
      Returns: string
    }
  }
  Enums: {
    etapa: Etapa
    rol_persona: RolPersona
    tipo_documento: TipoDocumento
    tipo_evento: TipoEvento
  }
  CompositeTypes: Record<string, never>
}

export interface Database {
  matriculas: MatriculasSchema
  /**
   * Placeholder para el resto del schema público. Se deja abierto para que
   * otros usos (auth, storage) no se rompan. Si añades tablas en `public`,
   * amplia aquí.
   */
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
