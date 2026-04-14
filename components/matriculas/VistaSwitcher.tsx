'use client'

import { useState, useEffect } from 'react'
import { Columns3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MatriculaKanban from './MatriculaKanban'
import MatriculaTable from './MatriculaTable'
import MatriculaCardList from './MatriculaCardList'
import type { MatriculaConPersonas, DocResumen } from '@/types'

type Vista = 'kanban' | 'tabla'

interface VistaSwitcherProps {
  matriculas: MatriculaConPersonas[]
  documentosPorMatricula: Record<string, DocResumen[]>
  total?: number
}

export default function VistaSwitcher({ matriculas, documentosPorMatricula, total }: VistaSwitcherProps) {
  const [vista, setVista] = useState<Vista>('kanban')

  useEffect(() => {
    const guardada = localStorage.getItem('matriculas-vista') as Vista | null
    if (guardada === 'kanban' || guardada === 'tabla') {
      setVista(guardada)
    }
  }, [])

  function cambiarVista(v: Vista) {
    setVista(v)
    localStorage.setItem('matriculas-vista', v)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">
          {total !== undefined ? total : matriculas.length} matrícula{(total ?? matriculas.length) !== 1 ? 's' : ''}
          {total !== undefined && total !== matriculas.length && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              (mostrando {matriculas.length})
            </span>
          )}
        </h2>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <Button
            variant={vista === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => cambiarVista('kanban')}
            className={`rounded-none gap-2 ${vista === 'kanban' ? 'bg-nc-green hover:bg-nc-green-dark' : ''}`}
          >
            <Columns3 className="h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant={vista === 'tabla' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => cambiarVista('tabla')}
            className={`rounded-none gap-2 ${vista === 'tabla' ? 'bg-nc-green hover:bg-nc-green-dark' : ''}`}
          >
            <List className="h-4 w-4" />
            Tabla
          </Button>
        </div>
      </div>

      {vista === 'kanban' ? (
        <MatriculaKanban
          matriculas={matriculas}
          documentosPorMatricula={documentosPorMatricula}
        />
      ) : (
        <>
          {/* Tabla en desktop */}
          <div className="hidden md:block">
            <MatriculaTable
              matriculas={matriculas}
              documentosPorMatricula={documentosPorMatricula}
            />
          </div>
          {/* Lista de cards en móvil */}
          <div className="md:hidden">
            <MatriculaCardList
              matriculas={matriculas}
              documentosPorMatricula={documentosPorMatricula}
            />
          </div>
        </>
      )}
    </div>
  )
}
