import type { CourseSection, Exam, ScheduleChange } from '@/types/academic'

export type ExamFilterType = 'all' | 'parcial' | 'final' | 'recuperatorio'

export interface ExamFilters {
  type: ExamFilterType
}

export const DEFAULT_EXAM_FILTERS: ExamFilters = {
  type: 'all',
}

/** Claves internas del importador → etiquetas en español para la UI. */
export const EXAM_TYPE_LABELS: Record<string, string> = {
  partial1: '1er parcial',
  parcial1: '1er parcial',
  partial2: '2do parcial',
  parcial2: '2do parcial',
  final1: '1er final',
  final2: '2do final',
  revision1: 'Revisión',
  revision2: '2da revisión',
  board: 'Mesa examinadora',
}

function normalizeExamTypeKey(examType: string): string {
  return examType.trim().toLowerCase().replace(/[\s._-]/g, '')
}

export interface ExamItem extends Exam {
  courseId: string
  courseName: string
  courseCode: string | null
  sectionCode: string
  academicPeriodId: string
}

export type ExamDisplayStatus =
  | 'confirmed'
  | 'pending'
  | 'modified'
  | 'stale'
  | 'offline'

export function collectExamItems(
  sections: CourseSection[],
  coursesById: Map<string, { name: string; code?: string | null }>,
): ExamItem[] {
  return sections.flatMap((section) => {
    const course = coursesById.get(section.courseId)
    return section.exams.map((exam) => ({
      ...exam,
      courseId: section.courseId,
      courseName: course?.name ?? 'Materia',
      courseCode: course?.code ?? null,
      sectionCode: section.sectionCode,
      academicPeriodId: section.academicPeriodId,
    }))
  })
}

export function categorizeExamType(examType: string): ExamFilterType | 'other' {
  const key = normalizeExamTypeKey(examType)

  if (key.startsWith('revision') || key.includes('recuper') || key.includes('revisi')) {
    return 'recuperatorio'
  }
  if (key.startsWith('partial') || key.includes('parcial')) {
    return 'parcial'
  }
  if (key.startsWith('final') || key.includes('final')) {
    return 'final'
  }
  return 'other'
}

export function formatExamTypeLabel(examType: string): string {
  const trimmed = examType.trim()
  if (!trimmed) return 'Otro'

  const mapped = EXAM_TYPE_LABELS[normalizeExamTypeKey(trimmed)]
  if (mapped) return mapped

  if (/parcial|final|revisi|recuper|mesa/i.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function filterExamItems(
  exams: ExamItem[],
  filters: ExamFilters,
): ExamItem[] {
  return exams.filter((exam) => {
    if (filters.type !== 'all') {
      const category = categorizeExamType(exam.examType)
      if (category === 'other') return false
      if (category !== filters.type) return false
    }
    return true
  })
}

export function sortExamsChronologically(exams: ExamItem[]): ExamItem[] {
  return [...exams].sort((left, right) => {
    const leftDate = left.examDate ?? '9999-12-31'
    const rightDate = right.examDate ?? '9999-12-31'
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate)
    const leftTime = left.startTime ?? '99:99'
    const rightTime = right.startTime ?? '99:99'
    return leftTime.localeCompare(rightTime)
  })
}

export function groupExamsByDate(exams: ExamItem[]): Array<{ date: string; exams: ExamItem[] }> {
  const sorted = sortExamsChronologically(exams)
  const groups = new Map<string, ExamItem[]>()

  for (const exam of sorted) {
    if (!exam.examDate) continue
    const list = groups.get(exam.examDate) ?? []
    list.push(exam)
    groups.set(exam.examDate, list)
  }

  return [...groups.entries()].map(([date, dateExams]) => ({ date, exams: dateExams }))
}

export function getExamsByDateMap(exams: ExamItem[]): Map<string, ExamItem[]> {
  const map = new Map<string, ExamItem[]>()
  for (const exam of exams) {
    if (!exam.examDate) continue
    const list = map.get(exam.examDate) ?? []
    list.push(exam)
    map.set(exam.examDate, list)
  }
  return map
}

export function getNextExam(exams: ExamItem[], fromDate = todayKey()): ExamItem | null {
  const sorted = sortExamsChronologically(
    exams.filter((exam) => exam.examDate && exam.examDate >= fromDate),
  )
  return sorted[0] ?? null
}

export function groupUpcomingExamsByRecency(
  exams: ExamItem[],
  fromDate = todayKey(),
): Array<{ label: string; exams: ExamItem[] }> {
  const upcoming = sortExamsChronologically(
    exams.filter((exam) => exam.examDate && exam.examDate >= fromDate),
  )

  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setHours(0, 0, 0, 0)
  weekEnd.setDate(weekEnd.getDate() + (7 - ((weekEnd.getDay() + 6) % 7)))
  const weekEndKey = toDateKey(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate())

  const today: ExamItem[] = []
  const thisWeek: ExamItem[] = []
  const later: ExamItem[] = []

  for (const exam of upcoming) {
    if (!exam.examDate) continue
    if (exam.examDate === fromDate) today.push(exam)
    else if (exam.examDate < weekEndKey) thisWeek.push(exam)
    else later.push(exam)
  }

  const groups: Array<{ label: string; exams: ExamItem[] }> = []
  if (today.length > 0) groups.push({ label: 'Hoy', exams: today })
  if (thisWeek.length > 0) groups.push({ label: 'Esta semana', exams: thisWeek })
  if (later.length > 0) groups.push({ label: 'Próximos', exams: later })
  return groups
}

export function todayKey(): string {
  const now = new Date()
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate())
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number)
  return { year: year!, month: month! - 1, day: day! }
}

export function formatExamDayHeader(dateKey: string): string {
  const { year, month, day } = parseDateKey(dateKey)
  const date = new Date(year, month, day)
  const weekday = date
    .toLocaleDateString('es-PY', { weekday: 'short' })
    .replace('.', '')
    .toUpperCase()
  const monthLabel = date
    .toLocaleDateString('es-PY', { month: 'short' })
    .replace('.', '')
    .toUpperCase()
  return `${weekday} ${day} ${monthLabel}`
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1)
  const label = date.toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatUpdatedShort(iso: string | null): string {
  if (!iso) return 'Sin registro de actualización'

  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    const time = date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    return `Actualizado hoy, ${time}`
  }

  return `Actualizado ${date.toLocaleDateString('es-PY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export function getExamChanges(
  exam: ExamItem,
  changes: ScheduleChange[],
): ScheduleChange[] {
  return changes.filter(
    (change) => change.entityType === 'exam' && change.sectionId === exam.sectionId,
  )
}

export function examHasModification(exam: ExamItem, changes: ScheduleChange[]): boolean {
  return getExamChanges(exam, changes).some((change) => !change.seen)
}

export function getExamDisplayStatus(
  exam: ExamItem,
  changes: ScheduleChange[],
  isOnline: boolean,
  dataIsStale: boolean,
): ExamDisplayStatus {
  if (!isOnline) return 'offline'
  if (examHasModification(exam, changes)) return 'modified'
  if (!exam.examDate || !exam.startTime || !exam.classroom) return 'pending'
  if (dataIsStale) return 'stale'
  return 'confirmed'
}

export function getMonthBounds(year: number, month: number): { start: string; end: string } {
  const start = toDateKey(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = toDateKey(year, month, lastDay)
  return { start, end }
}

export function buildMonthGrid(
  year: number,
  month: number,
): Array<{ dateKey: string | null; day: number | null }> {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<{ dateKey: string | null; day: number | null }> = []

  for (let index = 0; index < firstWeekday; index++) {
    cells.push({ dateKey: null, day: null })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ dateKey: toDateKey(year, month, day), day })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ dateKey: null, day: null })
  }

  return cells
}

export const EXAM_STATUS_LABELS: Record<ExamDisplayStatus, string> = {
  confirmed: 'Confirmado',
  pending: 'A confirmar',
  modified: 'Modificado',
  stale: 'Desactualizado',
  offline: 'Sin conexión',
}
