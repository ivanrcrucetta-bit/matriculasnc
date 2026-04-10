import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Matrículas — NuevoCredito SRL',
  description: 'Sistema de gestión de matrículas de vehículos financiados',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={GeistSans.className}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
