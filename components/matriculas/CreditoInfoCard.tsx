'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { getSupabaseBrowser } from '@/lib/supabase'

interface CreditoData {
  numero_credito: string
  estado?: string | null
  oficial?: string | null
  monto?: number | null
  cuotas_pagadas?: number | null
  cuotas_totales?: number | null
}

interface CreditoInfoCardProps {
  numeroCredito: string
}

export default function CreditoInfoCard({ numeroCredito }: CreditoInfoCardProps) {
  const [credito, setCredito] = useState<CreditoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCredito() {
      setLoading(true)
      try {
        const supabase = getSupabaseBrowser()
        // Try to find the credit in a 'creditos' or 'solicitudes' table
        // Adjust schema/table name based on your actual SolicitudCredito schema
        const { data, error: err } = await supabase
          .from('creditos' as never)
          .select('numero_credito, estado, oficial, monto, cuotas_pagadas, cuotas_totales')
          .eq('numero_credito' as never, numeroCredito)
          .single()

        if (err || !data) {
          setCredito({ numero_credito: numeroCredito })
        } else {
          setCredito(data as CreditoData)
        }
      } catch {
        setCredito({ numero_credito: numeroCredito })
      } finally {
        setLoading(false)
      }
    }

    fetchCredito()
  }, [numeroCredito])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Buscando información del crédito ({numeroCredito})…</span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
      <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold text-blue-900">
            {numeroCredito}
          </span>
          {credito?.estado && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
              {credito.estado}
            </span>
          )}
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700">
          {credito?.oficial && (
            <span>Oficial: <span className="font-medium">{credito.oficial}</span></span>
          )}
          {credito?.cuotas_totales != null && (
            <span>
              Cuotas: <span className="font-medium">
                {credito.cuotas_pagadas ?? 0}/{credito.cuotas_totales}
              </span>
            </span>
          )}
          {credito?.monto != null && (
            <span>Monto: <span className="font-medium">RD$ {credito.monto.toLocaleString()}</span></span>
          )}
        </div>
      </div>
    </div>
  )
}
