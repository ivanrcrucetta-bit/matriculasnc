import DashboardLayout from '@/components/layout/DashboardLayout'
import MatriculaWizard from '@/components/matriculas/form/MatriculaWizard'

export default function NuevaMatriculaPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nueva Matrícula</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Wizard en 3 pasos con autoguardado y detección de duplicados.
          </p>
        </div>
        <MatriculaWizard />
      </div>
    </DashboardLayout>
  )
}
