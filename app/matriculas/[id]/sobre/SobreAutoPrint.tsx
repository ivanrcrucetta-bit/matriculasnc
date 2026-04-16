'use client'

import { useEffect, useRef } from 'react'

/**
 * Abre el diálogo de impresión automáticamente al cargar la página del sobre.
 * A diferencia del antiguo PrintTrigger, esta página es mínima y no requiere
 * esperar imágenes, así que un único rAF alcanza para asegurar layout.
 */
export default function SobreAutoPrint() {
  const donePrint = useRef(false)
  useEffect(() => {
    if (donePrint.current) return
    donePrint.current = true
    const raf = requestAnimationFrame(() => {
      setTimeout(() => window.print(), 50)
    })
    return () => cancelAnimationFrame(raf)
  }, [])
  return null
}
