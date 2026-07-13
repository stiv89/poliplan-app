export function normalizeTeacherName(name: string | null | undefined): string | null {
  if (!name?.trim()) {
    return null
  }

  const normalized = name
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/^(prof\.?|dr\.?|dra\.?|ing\.?|lic\.?)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  return normalized.length > 0 ? normalized : null
}

export function teacherDedupKey(
  name: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const normalizedEmail = email?.trim().toLowerCase()
  if (normalizedEmail) {
    return `email:${normalizedEmail}`
  }

  const normalizedName = normalizeTeacherName(name)
  if (normalizedName) {
    return `name:${normalizedName}`
  }

  return null
}

export function formatReviewRatingAverage(rating: number | null): string {
  if (rating == null || Number.isNaN(rating)) {
    return '—'
  }
  return rating.toFixed(1)
}

export function ratingToPercent(rating: number): number {
  return Math.round((rating / 5) * 100)
}

export function formatRelativeReviewDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 1) return 'Hoy'
  if (diffDays === 1) return 'Hace 1 día'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`
  }
  const years = Math.floor(diffDays / 365)
  return years === 1 ? 'Hace 1 año' : `Hace ${years} años`
}

/** Mínimo de reseñas para mostrar promedios (privacidad). */
export const REVIEW_MIN_FOR_SUMMARY = 3

export const REVIEW_DIMENSIONS = [
  { id: 'clarity', label: 'Claridad al explicar', short: 'Claridad' },
  { id: 'organization', label: 'Organización', short: 'Organización' },
  { id: 'punctuality', label: 'Puntualidad', short: 'Puntualidad' },
  { id: 'workload', label: 'Carga de trabajo', short: 'Carga' },
  { id: 'evaluation', label: 'Dificultad de evaluación', short: 'Evaluación' },
  { id: 'feedback', label: 'Calidad del feedback', short: 'Feedback' },
] as const

export type ReviewDimensionId = (typeof REVIEW_DIMENSIONS)[number]['id']

export type ReviewDimensionRatings = Record<ReviewDimensionId, number>

/** Shown first in quick-review flows; the rest expand on demand. */
export const PRIMARY_REVIEW_DIMENSION_IDS = [
  'clarity',
  'organization',
  'evaluation',
] as const satisfies readonly ReviewDimensionId[]

export const SECONDARY_REVIEW_DIMENSION_IDS = [
  'punctuality',
  'workload',
  'feedback',
] as const satisfies readonly ReviewDimensionId[]

export const REVIEW_SUMMARY_CHIPS = [
  'Claridad',
  'Puntualidad',
  'Carga',
  'Evaluación',
] as const

export function defaultDimensionRatings(): ReviewDimensionRatings {
  return {
    clarity: 4,
    organization: 4,
    punctuality: 4,
    workload: 3,
    evaluation: 3,
    feedback: 4,
  }
}

export function averageDimensionRating(dimensions: ReviewDimensionRatings): number {
  const values = REVIEW_DIMENSIONS.map((dimension) => dimensions[dimension.id])
  const sum = values.reduce((total, value) => total + value, 0)
  return Math.round(sum / values.length)
}

export function buildStructuredReviewBody(
  dimensions: ReviewDimensionRatings,
  comment: string,
): string {
  const summary = REVIEW_DIMENSIONS.map(
    (dimension) => `${dimension.short}: ${dimensions[dimension.id]}/5`,
  ).join(' · ')
  const trimmed = comment.trim()
  return trimmed ? `${summary}\n\n${trimmed}` : summary
}
