'use client'

import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCedulaRD, formatTelefonoRD } from '@/lib/format-rd'
import { PROVINCIAS_RD, getMunicipios } from '@/lib/data/rd-provincias-municipios'
import type { MatriculaFormValues } from '@/lib/validations'

interface Props {
  form: UseFormReturn<MatriculaFormValues>
  prefix: 'comprador' | 'vendedor'
  titulo?: string
}

/**
 * Sección reutilizable de datos de persona (comprador o vendedor).
 * Extraída del monolito para que tanto el wizard como el formulario de
 * edición compartan exactamente los mismos inputs y validaciones.
 */
export default function PersonaSection({ form, prefix, titulo }: Props) {
  const provinciaSeleccionada = form.watch(
    `${prefix}.provincia` as `comprador.provincia`
  )

  return (
    <div className="space-y-4">
      {titulo && (
        <h3 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
          {titulo}
        </h3>
      )}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.nombre` as `comprador.nombre`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Juan" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.apellido` as `comprador.apellido`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apellido</FormLabel>
              <FormControl>
                <Input placeholder="Pérez" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.cedula` as `comprador.cedula`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cédula</FormLabel>
              <FormControl>
                <Input
                  placeholder="001-0000000-0"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(formatCedulaRD(e.target.value))
                  }
                  maxLength={13}
                  inputMode="numeric"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.telefono` as `comprador.telefono`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  placeholder="809-000-0000"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(formatTelefonoRD(e.target.value))
                  }
                  maxLength={12}
                  inputMode="numeric"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.provincia` as `comprador.provincia`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provincia</FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={(val) => {
                  field.onChange(val)
                  form.setValue(
                    `${prefix}.municipio` as `comprador.municipio`,
                    ''
                  )
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona provincia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROVINCIAS_RD.map((p) => (
                    <SelectItem key={p.nombre} value={p.nombre}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.municipio` as `comprador.municipio`}
          render={({ field }) => {
            const municipios = getMunicipios(provinciaSeleccionada ?? '')
            return (
              <FormItem>
                <FormLabel>Municipio</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  disabled={!provinciaSeleccionada}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          provinciaSeleccionada
                            ? 'Selecciona municipio'
                            : 'Elige provincia primero'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {municipios.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )
          }}
        />
      </div>
      <FormField
        control={form.control}
        name={`${prefix}.sector` as `comprador.sector`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sector / Calle</FormLabel>
            <FormControl>
              <Input
                placeholder="Ensanche Naco, Calle Principal #5"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
