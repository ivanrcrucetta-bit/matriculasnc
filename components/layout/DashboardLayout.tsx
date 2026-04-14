'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  alertasCount?: number
}

export default function DashboardLayout({ children, alertasCount }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        alertasCount={alertasCount}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 md:ml-[220px] min-w-0 min-h-screen">
        {/* Top bar solo en móvil */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-nc-green flex items-center justify-center">
              <span className="text-white text-xs font-bold">NC</span>
            </div>
            <span className="font-semibold text-sm text-gray-900">NuevoCredito</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
