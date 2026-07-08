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

export function getDayLabel(dayOfWeek: number): string {
  const labels = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return labels[dayOfWeek] ?? `Día ${dayOfWeek}`
}
