import { DAYS_OF_WEEK } from '@/config/constants'

/** Etiquetas genéricas por número de término (1 = primer período, 2 = segundo, …). */
export const ACADEMIC_TERM_LABELS: Record<number, string> = {
  1: 'Primer período',
  2: 'Segundo período',
  3: 'Tercer período',
}

export const SCHEDULE_FILTER_CONFIG = {
  /** Si hay nombre oficial en BD, usarlo; si no, armar con termLabels + año. */
  preferOfficialPeriodNames: true,
  termLabels: ACADEMIC_TERM_LABELS,
  /** Días disponibles en el toggle (lun–sáb por defecto). */
  availableDays: DAYS_OF_WEEK.map((day) => day.value),
  dayLabels: Object.fromEntries(
    DAYS_OF_WEEK.map((day) => [day.value, day.label.slice(0, 2)]),
  ) as Record<number, string>,
  timeRange: {
    minMinutes: 6 * 60,
    maxMinutes: 23 * 60 + 30,
    stepMinutes: 30,
  },
} as const
