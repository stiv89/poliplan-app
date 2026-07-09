export function formatDate(date: string | null): string {
  if (!date) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

export function formatDateTime(iso: string | null): string {
  if (!iso) {
    return 'Sin registro'
  }

  return new Intl.DateTimeFormat('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** "8 jul. de 2026 a las 03:03" — for summary trust copy. */
export function formatUpdatedLong(iso: string | null): string {
  if (!iso) return 'Sin registro de actualización'

  const date = new Date(iso)
  const day = date.toLocaleDateString('es-PY', { day: 'numeric' })
  const month = date.toLocaleDateString('es-PY', { month: 'short' }).replace('.', '')
  const year = date.getFullYear()
  const time = date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
  return `${day} ${month}. de ${year} a las ${time}`
}

export function getDayLabel(dayOfWeek: number): string {
  const labels = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return labels[dayOfWeek] ?? `Día ${dayOfWeek}`
}
