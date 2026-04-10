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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getSupabaseBrowser } from '@/lib/supabase'
import { toast } from 'sonner'

interface SidebarProps {
  alertasCount?: number
}

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matriculas', label: 'Matrículas', icon: FileText },
  { href: '/alertas', label: 'Alertas', icon: Bell },
  { href: '/buscar', label: 'Buscar por Cédula', icon: Search },
]

export default function Sidebar({ alertasCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-white border-r border-border flex flex-col z-30 shadow-sm">
      {/* Logo */}
      <div className="p-5 border-b border-border">
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
