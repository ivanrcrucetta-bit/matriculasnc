'use client'

import { useState, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
import Sidebar from './Sidebar'
import GlobalSearch from '@/components/search/GlobalSearch'

interface DashboardLayoutProps {
  children: React.ReactNode
  alertasCount?: number
}

export default function DashboardLayout({ children, alertasCount }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="print:hidden">
        <Sidebar
          alertasCount={alertasCount}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSearchOpen={() => setSearchOpen(true)}
        />
      </div>

      <main className="flex-1 md:ml-[220px] print:ml-0 min-w-0 min-h-screen">
        {/* Top bar solo en móvil */}
        <div className="md:hidden print:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-border sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-md bg-nc-green flex items-center justify-center">
              <span className="text-white text-xs font-bold">NC</span>
            </div>
            <span className="font-semibold text-sm text-gray-900">NuevoCredito</span>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="pb-20 md:pb-0">
          {children}
        </div>

        {/* Bottom nav para móvil */}
        <BottomNav alertasCount={alertasCount} onSearchOpen={() => setSearchOpen(true)} />
      </main>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

function BottomNav({
  alertasCount = 0,
  onSearchOpen,
}: {
  alertasCount?: number
  onSearchOpen: () => void
}) {
  return (
    <nav className="md:hidden print:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        <BottomNavItem href="/" icon="dashboard" label="Inicio" />
        <BottomNavItem href="/matriculas" icon="matriculas" label="Matrículas" />
        <button
          onClick={onSearchOpen}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">Buscar</span>
        </button>
        <BottomNavItem href="/alertas" icon="alertas" label="Alertas" badge={alertasCount} />
        <BottomNavItem href="/personas" icon="personas" label="Personas" />
      </div>
    </nav>
  )
}

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Bell,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const ICONS = {
  dashboard: LayoutDashboard,
  matriculas: FileText,
  alertas: Bell,
  personas: Users,
}

function BottomNavItem({
  href,
  icon,
  label,
  badge,
}: {
  href: string
  icon: keyof typeof ICONS
  label: string
  badge?: number
}) {
  const pathname = usePathname()
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
  const Icon = ICONS[icon]

  return (
    <Link
      href={href}
      className={cn(
        'relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors',
        active
          ? 'text-nc-green'
          : 'text-muted-foreground hover:text-gray-900 hover:bg-gray-50'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center text-[9px] px-1"
        >
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
    </Link>
  )
}
