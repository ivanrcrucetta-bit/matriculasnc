'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  X,
  Users,
  BarChart3,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getSupabaseBrowser } from '@/lib/supabase'
import { toast } from 'sonner'

interface SidebarProps {
  alertasCount?: number
  open?: boolean
  onClose?: () => void
  onSearchOpen?: () => void
}

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matriculas', label: 'Matrículas', icon: FileText },
  { href: '/alertas', label: 'Alertas', icon: Bell },
  { href: '/personas', label: 'Personas', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar({ alertasCount = 0, open = false, onClose, onSearchOpen }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full w-[220px] bg-white border-r border-border flex flex-col z-30 shadow-sm',
        'transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-nc-green flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">NC</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 leading-tight truncate">
              NuevoCredito
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              Matrículas
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Cerrar menú"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Búsqueda rápida */}
      <div className="px-3 pt-3">
        <button
          onClick={() => { onSearchOpen?.(); onClose?.() }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-gray-50 hover:bg-gray-100 rounded-lg border border-border transition-colors"
        >
          <Search className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="flex-1 text-left truncate">Buscar...</span>
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-white px-1.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                active
                  ? 'bg-nc-green-light text-nc-green font-medium'
                  : 'text-muted-foreground hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {href === '/alertas' && alertasCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 flex items-center justify-center text-xs px-1"
                >
                  {alertasCount > 99 ? '99+' : alertasCount}
                </Badge>
              )}
              {active && (
                <ChevronRight className="h-3 w-3 text-nc-green opacity-60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
