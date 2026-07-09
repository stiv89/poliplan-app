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

/** Human-readable activity line for the schedule summary panel. */
export function getActivityHeadline(change: ScheduleChange): string {
  const course = change.courseName?.trim() || 'una materia'

  switch (change.field) {
    case 'sectionAdded':
      return `Se agregó ${course}`
    case 'sectionRemoved':
      return `Se eliminó ${course}`
    case 'teacherName':
      return `Se actualizó el docente de ${course}`
    case 'meetingDay':
    case 'meetingTime':
    case 'meetingClassroom':
      return `Se cambió la sección de ${course}`
    case 'examDate':
    case 'examTime':
    case 'examClassroom':
      return `Se actualizó un examen de ${course}`
    default:
      return `Se actualizó ${course}`
  }
}

export function getActivityDetail(change: ScheduleChange): string | null {
  if (change.field === 'sectionAdded' || change.field === 'sectionRemoved') {
    return change.sectionCode ? `Sección ${change.sectionCode}` : null
  }

  const previous = formatChangeValue(change.field, change.previousValue)
  const next = formatChangeValue(change.field, change.newValue)

  if (previous === '—' && next === '—') {
    return change.sectionCode ? `Sección ${change.sectionCode}` : null
  }

  if (previous === '—') return `${getChangeFieldTitle(change.field)}: ${next}`
  if (next === '—') return `${getChangeFieldTitle(change.field)}: se quitó ${previous}`
  return `${getChangeFieldTitle(change.field)}: ${previous} → ${next}`
}

export type ActivityKindFilter = 'all' | 'added' | 'changed' | 'removed'

export function getActivityKind(change: ScheduleChange): Exclude<ActivityKindFilter, 'all'> {
  if (change.field === 'sectionAdded') return 'added'
  if (change.field === 'sectionRemoved') return 'removed'
  return 'changed'
}

export function filterActivityByKind(
  changes: ScheduleChange[],
  filter: ActivityKindFilter,
): ScheduleChange[] {
  if (filter === 'all') return changes
  return changes.filter((change) => getActivityKind(change) === filter)
}

export function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function groupChangesByActivityRecency(
  changes: ScheduleChange[],
): Array<{ label: string; changes: ScheduleChange[] }> {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekStart = new Date(now)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))

  const today: ScheduleChange[] = []
  const yday: ScheduleChange[] = []
  const thisWeek: ScheduleChange[] = []
  const older: ScheduleChange[] = []

  for (const change of changes) {
    const date = new Date(change.detectedAt)
    if (isSameDay(date, now)) today.push(change)
    else if (isSameDay(date, yesterday)) yday.push(change)
    else if (date >= weekStart) thisWeek.push(change)
    else older.push(change)
  }

  const groups: Array<{ label: string; changes: ScheduleChange[] }> = []
  if (today.length > 0) groups.push({ label: 'Hoy', changes: today })
  if (yday.length > 0) groups.push({ label: 'Ayer', changes: yday })
  if (thisWeek.length > 0) groups.push({ label: 'Esta semana', changes: thisWeek })
  if (older.length > 0) groups.push({ label: 'Anteriores', changes: older })
  return groups
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
