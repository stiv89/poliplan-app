export const APP_NAME = 'PoliPlan'

export const ROUTES = {
  home: '/',
  sections: '/secciones',
  schedule: '/horario',
  exams: '/examenes',
  settings: '/configuracion',
  offline: '/offline',
} as const

export const SYNC_INTERVAL_MS = 30 * 60 * 1000

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
