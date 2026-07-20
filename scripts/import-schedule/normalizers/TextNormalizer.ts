import { IMPORTER_CONFIG } from '../config'
import type { RawValue } from '../types'

export function normalizeText(value: unknown): RawValue {
  const rawValue = cellToRawString(value)
  const normalizedValue = rawValue
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

  return { rawValue, normalizedValue }
}

export function isEmptyValue(raw: RawValue): boolean {
  if (!raw.rawValue.trim()) {
    return true
  }

  return IMPORTER_CONFIG.ignoredValues.includes(raw.normalizedValue)
}

export function normalizeComparable(value: unknown): string {
  return normalizeText(value).normalizedValue
}

export function joinTeacherName(parts: RawValue[]): string {
  return parts
    .map((part) => part.rawValue.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function cellToRawString(value: unknown): string {
  if (value == null) {
    return ''
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return ''
    }
    // Excel time-only cells decoded as Date (SheetJS epoch ~1899/1900).
    // Emit HH:mm so TimeNormalizer does not scrape UTC from toISOString().
    if (value.getFullYear() <= 1900) {
      const hours = String(value.getHours()).padStart(2, '0')
      const minutes = String(value.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return value.toISOString()
  }

  return String(value).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizeCareerCode(value: unknown, fallbackSheetName: string): string {
  const raw = cellToRawString(value).trim()
  if (raw && raw !== '-- --' && raw !== '---') {
    return raw.toUpperCase()
  }
  return fallbackSheetName.trim().toUpperCase()
}

export function buildCourseNaturalKey(
  careerCode: string,
  courseName: string,
  level: string | null,
): string {
  return [careerCode, normalizeComparable(courseName), level ?? ''].join('|')
}

export function buildSectionNaturalKey(
  periodId: string,
  careerCode: string,
  courseName: string,
  sectionCode: string,
  shift: string | null,
  specificElectiveName?: string | null,
): string {
  return [
    periodId,
    careerCode,
    normalizeComparable(courseName),
    specificElectiveName ? normalizeComparable(specificElectiveName) : '',
    sectionCode,
    shift ?? '',
  ]
    .join('|')
    .toLowerCase()
}
