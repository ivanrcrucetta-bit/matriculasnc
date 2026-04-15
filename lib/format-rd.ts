/**
 * Formatea dígitos como cédula dominicana: XXX-XXXXXXX-X
 * Acepta cualquier string; filtra todo lo que no sea dígito.
 */
export function formatCedulaRD(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`
}

/**
 * Formatea dígitos como teléfono dominicano: 809-XXX-XXXX
 * Prefijos válidos RD: 809, 829, 849.
 * Si el usuario escribe con 1 delante (ej. 1-809-...) lo descarta.
 */
export function formatTelefonoRD(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  // Descartar prefijo internacional '1' si viene con 11 dígitos
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1)
  }
  digits = digits.slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}
