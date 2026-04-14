import Link from 'next/link'
import { Users, ExternalLink } from 'lucide-react'
import { createSupabaseServer } from '@/lib/supabase-server'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface PersonaRaw {
  id: string
  matricula_id: string
  nombre: string
  apellido: string
  cedula: string | null
  telefono: string | null
  rol: string
  matriculas: { id: string; codigo: string; etapa: string; placa: string | null } | null
}

interface PersonaAgrupada {
  cedulaKey: string
  nombre: string
  apellido: string
  cedula: string | null
  telefono: string | null
  roles: string[]
  apariciones: Array<{
    id: string
    matricula_id: string
    codigo: string
    etapa: string
    placa: string | null
    rol: string
  }>
}

export default async function PersonasPage() {
  const supabase = createSupabaseServer()
  const schema = supabase.schema('matriculas' as 'public')

  const { data: personasData } = await schema
    .from('personas' as never)
    .select('id, matricula_id, nombre, apellido, cedula, telefono, rol, matriculas!inner(id, codigo, etapa, placa)')
    .order('apellido' as never, { ascending: true })
    .order('nombre' as never, { ascending: true })

  const personas = (personasData ?? []) as PersonaRaw[]

  // Group by cedula (or by nombre+apellido if no cedula)
  const mapa = new Map<string, PersonaAgrupada>()

  for (const p of personas) {
    const key = p.cedula ? `ced:${p.cedula}` : `nom:${p.nombre.toLowerCase()}-${p.apellido.toLowerCase()}`
    const mat = p.matriculas

    if (!mapa.has(key)) {
      mapa.set(key, {
        cedulaKey: key,
        nombre: p.nombre,
        apellido: p.apellido,
        cedula: p.cedula,
        telefono: p.telefono,
        roles: [],
        apariciones: [],
      })
    }

    const entry = mapa.get(key)!
    if (!entry.roles.includes(p.rol)) entry.roles.push(p.rol)
    if (mat) {
      entry.apariciones.push({
        id: p.id,
        matricula_id: p.matricula_id,
        codigo: mat.codigo,
        etapa: mat.etapa,
        placa: mat.placa,
        rol: p.rol,
      })
    }
  }

  const agrupadas = Array.from(mapa.values()).sort((a, b) =>
    a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre)
  )

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Directorio de Personas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {agrupadas.length} persona{agrupadas.length !== 1 ? 's' : ''} registradas
          </p>
        </div>

        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cédula</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol(es)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Matrículas</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {agrupadas.map((p) => (
                <tr key={p.cedulaKey} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.cedula ? (
                      <Link
                        href={`/personas/${encodeURIComponent(p.cedula)}`}
                        className="hover:text-nc-green hover:underline"
                      >
                        {p.apellido}, {p.nombre}
                      </Link>
                    ) : (
                      <span>{p.apellido}, {p.nombre}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">
                    {p.cedula ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {p.telefono ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.roles.map((rol) => (
                        <span
                          key={rol}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            rol === 'comprador'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {rol === 'comprador' ? 'Cliente' : 'Vendedor'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {p.apariciones.slice(0, 3).map((a) => (
                        <Link
                          key={a.id}
                          href={`/matriculas/${a.matricula_id}`}
                          className="text-xs font-mono text-nc-green hover:underline"
                          title={`${a.etapa} · ${a.placa ?? 'sin placa'}`}
                        >
                          {a.codigo}
                        </Link>
                      ))}
                      {p.apariciones.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{p.apariciones.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.cedula && (
                      <Link href={`/personas/${encodeURIComponent(p.cedula)}`}>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-nc-green" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {agrupadas.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No hay personas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
