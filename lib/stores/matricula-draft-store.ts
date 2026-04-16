import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MatriculaFormValues } from '@/lib/validations'

/**
 * Store de borrador para la creación de matrículas.
 *
 * Persistido en sessionStorage: si el usuario cierra y reabre la pestaña,
 * el formulario vuelve al mismo estado. Al completar la creación se limpia.
 */

export const EMPTY_DRAFT: MatriculaFormValues = {
  numero_credito: '',
  codigo: '',
  placa: '',
  chasis: '',
  marca: '',
  modelo: '',
  año: undefined,
  color: '',
  lleva_traspaso: true,
  lleva_oposicion: true,
  notas: '',
  comprador: {
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    direccion: '',
    provincia: '',
    municipio: '',
    sector: '',
  },
  vendedor: {
    nombre: '',
    apellido: '',
    cedula: '',
    telefono: '',
    direccion: '',
    provincia: '',
    municipio: '',
    sector: '',
  },
}

interface DraftState {
  draft: MatriculaFormValues
  step: number
  matriculaIdCreada: string | null
  touched: boolean
  setDraft: (d: Partial<MatriculaFormValues>) => void
  setFullDraft: (d: MatriculaFormValues) => void
  setStep: (step: number) => void
  setMatriculaIdCreada: (id: string | null) => void
  reset: () => void
}

export const useMatriculaDraft = create<DraftState>()(
  persist(
    (set) => ({
      draft: EMPTY_DRAFT,
      step: 0,
      matriculaIdCreada: null,
      touched: false,
      setDraft: (d) =>
        set((s) => ({
          draft: { ...s.draft, ...d },
          touched: true,
        })),
      setFullDraft: (d) => set({ draft: d, touched: true }),
      setStep: (step) => set({ step }),
      setMatriculaIdCreada: (id) => set({ matriculaIdCreada: id }),
      reset: () =>
        set({
          draft: EMPTY_DRAFT,
          step: 0,
          matriculaIdCreada: null,
          touched: false,
        }),
    }),
    {
      name: 'matricula-draft-v1',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return window.sessionStorage
      }),
      partialize: (s) => ({
        draft: s.draft,
        step: s.step,
        matriculaIdCreada: s.matriculaIdCreada,
        touched: s.touched,
      }),
    }
  )
)
