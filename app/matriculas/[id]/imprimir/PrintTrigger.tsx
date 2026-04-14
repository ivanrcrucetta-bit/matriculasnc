'use client'

import { useEffect } from 'react'

export default function PrintTrigger() {
  useEffect(() => {
    // Small delay to allow images to start loading before the print dialog
    const t = setTimeout(() => {
      window.print()
    }, 800)
    return () => clearTimeout(t)
  }, [])

  return null
}
