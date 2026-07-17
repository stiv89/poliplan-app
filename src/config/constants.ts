export const APP_NAME = 'PoliPlan'

export const ROUTES = {
  home: '/',
  sections: '/secciones',
  schedule: '/',
  exams: '/examenes',
  grading: '/calculadora',
  progress: '/progreso',
  changes: '/novedades',
  settings: '/configuracion',
  offline: '/offline',
  sharedSchedule: '/compartir/:shareRef',
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

/** Paleta suave para distinguir materias en el horario (modo claro) */
export const COURSE_COLORS = [
  { bg: '#F4F7FF', border: '#D9E2F5', text: '#334155', subtext: '#64748B', faint: '#94A3B8' },
  { bg: '#F2FBF6', border: '#CFE8DC', text: '#334155', subtext: '#64748B', faint: '#94A3B8' },
  { bg: '#FFFBF2', border: '#F5E6C8', text: '#334155', subtext: '#64748B', faint: '#94A3B8' },
  { bg: '#F7F4FF', border: '#E4DCF7', text: '#334155', subtext: '#64748B', faint: '#94A3B8' },
  { bg: '#FDF4F9', border: '#F3D9E8', text: '#334155', subtext: '#64748B', faint: '#94A3B8' },
  { bg: '#FFF8F3', border: '#F7DEC8', text: '#334155', subtext: '#64748B', faint: '#94A3B8' },
  { bg: '#F2FCFD', border: '#CFEEF2', text: '#334155', subtext: '#64748B', faint: '#94A3B8' },
  { bg: '#F8FAFC', border: '#E2E8F0', text: '#334155', subtext: '#64748B', faint: '#94A3B8' },
] as const

/** Paleta más saturada para bloques del horario en modo oscuro */
export const COURSE_COLORS_DARK = [
  { bg: 'rgba(55, 98, 190, 0.32)', border: 'rgba(120, 160, 240, 0.38)', text: '#E8EEFB', subtext: '#B8CAEA', faint: '#94AEDB' },
  { bg: 'rgba(34, 130, 88, 0.30)', border: 'rgba(80, 175, 130, 0.36)', text: '#E5F7EE', subtext: '#B5DEC9', faint: '#8EC9AD' },
  { bg: 'rgba(180, 125, 40, 0.28)', border: 'rgba(220, 175, 80, 0.34)', text: '#FFF3DC', subtext: '#E8D4A8', faint: '#CDB882' },
  { bg: 'rgba(120, 82, 210, 0.30)', border: 'rgba(165, 135, 255, 0.36)', text: '#F0EAFF', subtext: '#CDBFF5', faint: '#AB93E8' },
  { bg: 'rgba(185, 72, 120, 0.28)', border: 'rgba(230, 120, 165, 0.34)', text: '#FFEAF3', subtext: '#E8B8CE', faint: '#CF93B0' },
  { bg: 'rgba(195, 95, 45, 0.28)', border: 'rgba(235, 145, 85, 0.34)', text: '#FFEDE0', subtext: '#E8C4A8', faint: '#CF9E78' },
  { bg: 'rgba(38, 150, 170, 0.28)', border: 'rgba(85, 195, 215, 0.34)', text: '#E3F9FD', subtext: '#B0E0EA', faint: '#7EC6D6' },
  { bg: 'rgba(95, 115, 150, 0.30)', border: 'rgba(145, 165, 205, 0.36)', text: '#ECF1F8', subtext: '#B8C8DE', faint: '#93A8C4' },
] as const

export type CourseColor = (typeof COURSE_COLORS)[number]

/** Acentos más saturados para avatares y títulos en listas mobile. */
export const MOBILE_COURSE_ACCENTS = [
  '#0B3B8F',
  '#1E4FA3',
  '#2563EB',
  '#1D4ED8',
  '#0369A1',
  '#0E7490',
  '#4338CA',
  '#6D28D9',
] as const

export function getCourseListAccent(courseId: string): string {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0
  }
  return MOBILE_COURSE_ACCENTS[hash % MOBILE_COURSE_ACCENTS.length]!
}

export function getCourseInitial(name: string, code: string | null | undefined): string {
  const fromName = name.trim().match(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/)?.[0]
  if (fromName) return fromName.toUpperCase()
  const fromCode = code?.match(/[A-Za-z]/)?.[0]
  if (fromCode) return fromCode.toUpperCase()
  return '?'
}

/** Devuelve un color determinista para una courseId dada */
export function getCourseColor(courseId: string, mode: 'light' | 'dark' = 'light'): CourseColor {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0
  }
  const palette = mode === 'dark' ? COURSE_COLORS_DARK : COURSE_COLORS
  return palette[hash % palette.length]! as CourseColor
}
