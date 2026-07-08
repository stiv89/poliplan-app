import type { ChangeField, ChangeSeverity, ScheduleChange } from '@/types/academic'
import { formatDate } from '@/utils/dates'
import { getDayLabel } from '@/utils/dates'

export type ChangeFilter = 'all' | 'mine' | 'exams'

const FIELD_LABELS: Record<ChangeField, string> = {
  examDate: 'la fecha del examen',
  examTime: 'el horario del examen',
  examClassroom: 'el aula del examen',
  meetingDay: 'el día de clase',
  meetingTime: 'el horario de clase',
  meetingClassroom: 'el aula de clase',
  teacherName: 'el docente',
  sectionAdded: 'una sección nueva',
  sectionRemoved: 'la sección',
}

const FIELD_TITLES: Record<ChangeField, string> = {
  examDate: 'Fecha de examen',
  examTime: 'Horario de examen',
  examClassroom: 'Aula de examen',
  meetingDay: 'Día de clase',
  meetingTime: 'Horario de clase',
  meetingClassroom: 'Aula de clase',
  teacherName: 'Docente',
  sectionAdded: 'Sección nueva',
  sectionRemoved: 'Sección eliminada',
}

export const SEVERITY_BADGE: Record<ChangeSeverity, string | null> = {
  critical: 'Importante',
  important: null,
  informational: null,
}

export function getChangeFieldTitle(field: ChangeField): string {
  return FIELD_TITLES[field] ?? field
}

export function getChangeSummary(change: ScheduleChange): string {
  if (change.field === 'sectionRemoved') {
    return 'Se eliminó una sección de tu horario'
  }
  if (change.field === 'sectionAdded') {
    return 'Hay una sección nueva disponible'
  }
  return `Cambió ${FIELD_LABELS[change.field] ?? 'un dato'}`
}

export function formatChangeValue(field: ChangeField, value: string | null): string {
  if (value === null || value === '') return '—'

  if (field === 'examDate') {
    return formatDate(value)
  }

  if (field === 'meetingDay') {
    const day = Number(value)
    return Number.isFinite(day) ? getDayLabel(day) : value
  }

  if (field === 'examTime' || field === 'meetingTime') {
    return value.replace(/:00/g, '').replace('–', ' – ')
  }

  return value
}

export function isExamChange(change: ScheduleChange): boolean {
  return (
    change.entityType === 'exam' ||
    change.field === 'examDate' ||
    change.field === 'examTime' ||
    change.field === 'examClassroom'
  )
}

export function filterChanges(
  changes: ScheduleChange[],
  filter: ChangeFilter,
  selectedSectionIds: Set<string>,
): ScheduleChange[] {
  return changes.filter((change) => {
    if (filter === 'exams') return isExamChange(change)
    if (filter === 'mine') {
      if (isExamChange(change)) return false
      if (change.field === 'sectionAdded') return true
      return selectedSectionIds.has(change.sectionId)
    }
    return true
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

export function groupChangesByRecency(
  changes: ScheduleChange[],
): Array<{ label: string; changes: ScheduleChange[] }> {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const today: ScheduleChange[] = []
  const yday: ScheduleChange[] = []
  const older: ScheduleChange[] = []

  for (const change of changes) {
    const date = new Date(change.detectedAt)
    if (isSameDay(date, now)) today.push(change)
    else if (isSameDay(date, yesterday)) yday.push(change)
    else older.push(change)
  }

  const groups: Array<{ label: string; changes: ScheduleChange[] }> = []
  if (today.length > 0) groups.push({ label: 'Hoy', changes: today })
  if (yday.length > 0) groups.push({ label: 'Ayer', changes: yday })
  if (older.length > 0) groups.push({ label: 'Anteriores', changes: older })
  return groups
}

export function formatChangeDetectedAt(iso: string): string {
  const date = new Date(iso)
  const now = new Date()

  if (isSameDay(date, now)) {
    const time = date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    return `Actualizado hoy, ${time}`
  }

  if (
    date.toDateString() ===
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString()
  ) {
    return 'Actualizado ayer'
  }

  return `Actualizado ${formatDate(iso.slice(0, 10))}`
}

export function formatLastReview(iso: string | null): string {
  if (!iso) return 'Sin registro de revisión'

  const date = new Date(iso)
  const now = new Date()
  if (isSameDay(date, now)) {
    const time = date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    return `Última revisión: hoy, ${time}`
  }

  return `Última revisión: ${date.toLocaleDateString('es-PY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}`
}
