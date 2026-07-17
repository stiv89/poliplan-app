import type { AcademicPeriod, Career } from '@/types/academic'

const DEFAULT_SCHEDULE_TITLES = new Set(['mi horario', 'horario'])

const TERM_ORDINALS: Record<number, string> = {
  1: '1.er',
  2: '2.º',
  3: '3.er',
  4: '4.º',
  5: '5.º',
}

const PERIOD_NAME_PATTERN =
  /^(Primer|Segundo|Tercer|Cuarto|Quinto)\s+[Pp]er[ií]odo\s+(\d{4})$/i

const PERIOD_ORDINAL_FROM_NAME: Record<string, string> = {
  primer: '1.er',
  segundo: '2.º',
  tercer: '3.er',
  cuarto: '4.º',
  quinto: '5.º',
}

/** Título del encabezado: limpio y sin “Mi horario” genérico. */
export function formatScheduleHeaderTitle(name: string): string {
  const trimmed = name.trim()
  if (!trimmed || DEFAULT_SCHEDULE_TITLES.has(trimmed.toLowerCase())) {
    return 'Horario'
  }
  return trimmed
}

/** Periodo compacto: “1.er periodo 2026”. */
export function formatCompactPeriodLabel(
  period: Pick<AcademicPeriod, 'term' | 'year' | 'name'>,
): string {
  const ordinal = TERM_ORDINALS[period.term] ?? `${period.term}.º`
  return `${ordinal} periodo ${period.year}`
}

/** Periodo ultra compacto para mobile: “1.er · 2026”. */
export function formatCompactPeriodShortLabel(
  period: Pick<AcademicPeriod, 'term' | 'year' | 'name'>,
): string {
  const ordinal = TERM_ORDINALS[period.term] ?? `${period.term}.º`
  return `${ordinal} · ${period.year}`
}

/** Sigla sola para badges mobile; nombre completo queda en aria/popover. */
export function formatCareerCompactLabel(
  career: Pick<Career, 'code' | 'name'> | null | undefined,
  fallback = 'Carrera',
): string {
  if (!career) return fallback
  const code = career.code?.trim()
  if (code) return code
  return formatCareerDisplayLabel(career, fallback)
}

function compactPeriodNameFromString(name: string): string {
  const match = name.trim().match(PERIOD_NAME_PATTERN)
  if (!match) return name.trim()

  const ordinal =
    PERIOD_ORDINAL_FROM_NAME[match[1]!.toLowerCase()] ?? match[1]!.toLowerCase()
  return `${ordinal} periodo ${match[2]}`
}

/** Carrera con sigla + nombre: “IIN · Ingeniería Informática”. */
export function formatCareerDisplayLabel(
  career: Pick<Career, 'code' | 'name'> | null | undefined,
  fallback = 'Carrera',
): string {
  if (!career) return fallback

  const code = career.code?.trim()
  const name = career.name?.trim()

  if (
    code &&
    name &&
    code.localeCompare(name, undefined, { sensitivity: 'accent' }) !== 0
  ) {
    return `${code} · ${name}`
  }

  return code ?? name ?? fallback
}

/** Subtítulo del encabezado: “IIN · 1.er periodo 2026”. */
export function buildScheduleHeaderSubtitle(
  careerLabel: string | undefined,
  period: Pick<AcademicPeriod, 'term' | 'year' | 'name'> | null,
  periodNameFallback: string | null,
): string {
  const periodPart = period
    ? formatCompactPeriodLabel(period)
    : periodNameFallback
      ? compactPeriodNameFromString(periodNameFallback)
      : null

  if (careerLabel && periodPart) return `${careerLabel} · ${periodPart}`
  if (careerLabel) return `${careerLabel} · Elegí periodo`
  if (periodPart) return `Elegí carrera · ${periodPart}`
  return 'Carrera y periodo'
}
