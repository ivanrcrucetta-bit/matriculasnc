'use client'

import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { MatriculaFormValues } from '@/lib/validations'

interface Props {
  form: UseFormReturn<MatriculaFormValues>
}

export default function VehiculoSection({ form }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="codigo"
        render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>
              Código{' '}
              <span className="text-xs text-muted-foreground font-normal">
                (auto-generado)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="NC-2025-001"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="placa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placa *</FormLabel>
              <FormControl>
                <Input placeholder="A000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="marca"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input placeholder="Toyota" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="modelo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Corolla" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="año"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Año</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2024"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <Input placeholder="Blanco" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="chasis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chasis</FormLabel>
              <FormControl>
                <Input placeholder="VIN" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <Separator />
      <div className="flex gap-8">
        <FormField
          control={form.control}
          name="lleva_traspaso"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4 accent-nc-green"
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                ¿Lleva traspaso?
              </FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lleva_oposicion"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-4 h-4 accent-nc-green"
                />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                ¿Lleva oposición?
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
