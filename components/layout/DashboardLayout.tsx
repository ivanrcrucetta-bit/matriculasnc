import Sidebar from './Sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  alertasCount?: number
}

export default function DashboardLayout({ children, alertasCount }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar alertasCount={alertasCount} />
      <main className="flex-1 ml-[220px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
