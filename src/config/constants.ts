export const APP_NAME = 'PoliPlan'

export const ROUTES = {
  home: '/',
  sections: '/secciones',
  schedule: '/horario',
  exams: '/examenes',
  grading: '/calculadora',
  progress: '/progreso',
  changes: '/novedades',
  settings: '/configuracion',
  offline: '/offline',
} as const

export const SYNC_INTERVAL_MS = 30 * 60 * 1000

/** Página oficial de horarios y exámenes de la Facultad. */
export const OFFICIAL_SCHEDULE_SOURCE_URL =
  'https://www.pol.una.py/academico/horarios-de-clases-y-examenes/'

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
] as const

export const SCHEDULE_HOURS = {
  start: 7,
  end: 22,
} as const

export const COLORS = {
  primary: '#0B3B8F',
  primaryLight: '#3B82F6',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#16A34A',
} as const

/** Paleta de colores pastel para distinguir materias en el horario */
export const COURSE_COLORS = [
  { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' }, // azul
  { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' }, // verde
  { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }, // ámbar
  { bg: '#EDE9FE', border: '#C4B5FD', text: '#4C1D95' }, // violeta
  { bg: '#FCE7F3', border: '#F9A8D4', text: '#9D174D' }, // rosa
  { bg: '#FFEDD5', border: '#FDC8A0', text: '#9A3412' }, // naranja
  { bg: '#CFFAFE', border: '#67E8F9', text: '#155E75' }, // cyan
  { bg: '#F0FDF4', border: '#86EFAC', text: '#14532D' }, // esmeralda
] as const

export type CourseColor = (typeof COURSE_COLORS)[number]

/** Devuelve un color determinista para una courseId dada */
export function getCourseColor(courseId: string): CourseColor {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0
  }
  return COURSE_COLORS[hash % COURSE_COLORS.length]!
}
