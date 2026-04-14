'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ETAPA_INFO, TIPO_DOC_LABELS } from '@/types'
import type { Matricula, Persona, Documento, EventoHistorial, TipoDocumento } from '@/types'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#1a1a1a',
  },
  header: {
    borderBottom: '2 solid #1D9E75',
    paddingBottom: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1D9E75',
  },
  headerSub: {
    fontSize: 10,
    color: '#555',
    marginTop: 2,
  },
  seccion: {
    marginBottom: 16,
  },
  seccionTitulo: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1D9E75',
    borderBottom: '1 solid #E1F5EE',
    paddingBottom: 4,
    marginBottom: 8,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  campo: {
    width: '48%',
    marginBottom: 4,
  },
  campoLabel: {
    fontSize: 8,
    color: '#888',
    marginBottom: 1,
  },
  campoValor: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  docMarca: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  docLabel: {
    fontSize: 10,
  },
  histRow: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1 solid #f0f0f0',
  },
  histFecha: {
    fontSize: 8,
    color: '#888',
  },
  histDesc: {
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #ddd',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#888',
  },
})

interface ExpedienteDocumentProps {
  matricula: Matricula
  personas: Persona[]
  documentos: Documento[]
  historial: EventoHistorial[]
  oficinaNombre: string
}

function ExpedienteDocument({
  matricula,
  personas,
  documentos,
  historial,
  oficinaNombre,
}: ExpedienteDocumentProps) {
  const comprador = personas.find((p) => p.rol === 'comprador')
  const vendedor = personas.find((p) => p.rol === 'vendedor')
  const tiposDoc = documentos.map((d) => d.tipo)
  const fechaGen = format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })

  const DOCS_CHECKLIST: TipoDocumento[] = [
    'copia_matricula',
    'cedula_comprador',
    'cedula_vendedor',
    'contrato_venta',
    'fotocopia_matricula_vigente',
    'comprobante_dgii',
    'carta_credito',
    'certificado_deuda',
    'poder_notarial',
    'carta_no_objecion',
    'contrato_prenda',
  ]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{oficinaNombre}</Text>
          <Text style={styles.headerSub}>Expediente de Matrícula · {matricula.codigo}</Text>
        </View>

        {/* Datos matrícula */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Datos del Vehículo</Text>
          <View style={styles.grid2}>
            {[
              { label: 'Código', value: matricula.codigo },
              { label: 'Placa', value: matricula.placa ?? '—' },
              { label: 'Chasis', value: matricula.chasis ?? '—' },
              { label: 'Marca', value: matricula.marca ?? '—' },
              { label: 'Modelo', value: matricula.modelo ?? '—' },
              { label: 'Año', value: matricula.año?.toString() ?? '—' },
              { label: 'Color', value: matricula.color ?? '—' },
              { label: 'Código cliente', value: matricula.numero_credito ?? '—' },
            ].map(({ label, value }) => (
              <View key={label} style={styles.campo}>
                <Text style={styles.campoLabel}>{label}</Text>
                <Text style={styles.campoValor}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comprador */}
        {comprador && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Cliente</Text>
            <View style={styles.grid2}>
              {[
                { label: 'Nombre', value: `${comprador.nombre} ${comprador.apellido}` },
                { label: 'Cédula', value: comprador.cedula ?? '—' },
                { label: 'Teléfono', value: comprador.telefono ?? '—' },
                { label: 'Dirección', value: comprador.direccion ?? '—' },
              ].map(({ label, value }) => (
                <View key={label} style={styles.campo}>
                  <Text style={styles.campoLabel}>{label}</Text>
                  <Text style={styles.campoValor}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Vendedor */}
        {vendedor && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Vendedor</Text>
            <View style={styles.grid2}>
              {[
                { label: 'Nombre', value: `${vendedor.nombre} ${vendedor.apellido}` },
                { label: 'Cédula', value: vendedor.cedula ?? '—' },
                { label: 'Teléfono', value: vendedor.telefono ?? '—' },
                { label: 'Dirección', value: vendedor.direccion ?? '—' },
              ].map(({ label, value }) => (
                <View key={label} style={styles.campo}>
                  <Text style={styles.campoLabel}>{label}</Text>
                  <Text style={styles.campoValor}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Checklist docs */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Documentos</Text>
          {DOCS_CHECKLIST.map((tipo) => (
            <View key={tipo} style={styles.docRow}>
              <Text style={[styles.docMarca, { color: tiposDoc.includes(tipo) ? '#1D9E75' : '#EF4444' }]}>
                {tiposDoc.includes(tipo) ? '✓' : '✗'}
              </Text>
              <Text style={styles.docLabel}>{TIPO_DOC_LABELS[tipo]}</Text>
            </View>
          ))}
        </View>

        {/* Etapa actual */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Estado Actual</Text>
          <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold' }}>
            {ETAPA_INFO[matricula.etapa].label}
          </Text>
          {matricula.fecha_oposicion && (
            <Text style={{ fontSize: 9, color: '#555', marginTop: 2 }}>
              Oposición: {matricula.fecha_oposicion}
            </Text>
          )}
          {matricula.fecha_traspaso && (
            <Text style={{ fontSize: 9, color: '#555', marginTop: 2 }}>
              Traspaso iniciado: {matricula.fecha_traspaso}
            </Text>
          )}
        </View>

        {/* Notas */}
        {matricula.notas && (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Notas</Text>
            <Text style={{ fontSize: 10 }}>{matricula.notas}</Text>
          </View>
        )}

        {/* Historial (últimos 10) */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Historial de Actividad</Text>
          {historial.slice(0, 10).map((evento) => (
            <View key={evento.id} style={styles.histRow}>
              <Text style={styles.histFecha}>
                {evento.created_at
                  ? format(new Date(evento.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
                  : ''}
                {evento.usuario_nombre ? ` · ${evento.usuario_nombre}` : ''}
              </Text>
              <Text style={styles.histDesc}>{evento.descripcion}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{oficinaNombre}</Text>
          <Text>Generado el {fechaGen}</Text>
          <Text>{matricula.codigo}</Text>
        </View>
      </Page>
    </Document>
  )
}

interface ExpedientePDFProps {
  matricula: Matricula
  personas: Persona[]
  documentos: Documento[]
  historial: EventoHistorial[]
}

export default function ExpedientePDF({
  matricula,
  personas,
  documentos,
  historial,
}: ExpedientePDFProps) {
  const oficinaNombre =
    process.env.NEXT_PUBLIC_OFICINA_NOMBRE ?? 'NuevoCredito SRL'

  return (
    <PDFDownloadLink
      document={
        <ExpedienteDocument
          matricula={matricula}
          personas={personas}
          documentos={documentos}
          historial={historial}
          oficinaNombre={oficinaNombre}
        />
      }
      fileName={`expediente-${matricula.codigo}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" className="w-full gap-2" disabled={loading}>
          <FileDown className="h-4 w-4" />
          {loading ? 'Generando PDF...' : 'Descargar Expediente PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
