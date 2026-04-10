import DashboardLayout from '@/components/layout/DashboardLayout'
import MatriculaForm from '@/components/matriculas/MatriculaForm'

export default function NuevaMatriculaPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nueva Matrícula</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registra una nueva matrícula para un vehículo financiado
          </p>
        </div>
        <MatriculaForm modo="crear" />
      </div>
    </DashboardLayout>
  )
}
