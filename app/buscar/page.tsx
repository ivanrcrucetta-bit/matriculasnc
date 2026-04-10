import DashboardLayout from '@/components/layout/DashboardLayout'
import BuscarCedulaClient from './BuscarCedulaClient'

export default function BuscarPage() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buscar por Cédula</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Busca compradores o vendedores por número de cédula
          </p>
        </div>
        <BuscarCedulaClient />
      </div>
    </DashboardLayout>
  )
}
