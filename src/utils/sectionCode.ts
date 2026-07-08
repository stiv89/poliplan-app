import { stripAccents } from '@/utils/courseMatching'

export const SECTION_SHIFT_LETTERS = {
  M: 'Mañana',
  T: 'Tarde',
  N: 'Noche',
} as const

export type SectionShift = (typeof SECTION_SHIFT_LETTERS)[keyof typeof SECTION_SHIFT_LETTERS]

const SHIFT_ALIASES: Record<string, SectionShift> = {
  m: 'Mañana',
  manana: 'Mañana',
  t: 'Tarde',
  tarde: 'Tarde',
  n: 'Noche',
  noche: 'Noche',
}

export function shiftFromSectionCode(sectionCode: string | null | undefined): SectionShift | null {
  if (!sectionCode?.trim()) return null
  const letter = sectionCode.trim().charAt(0).toUpperCase()
  return SECTION_SHIFT_LETTERS[letter as keyof typeof SECTION_SHIFT_LETTERS] ?? null
}

export function normalizeShiftValue(shift: string | null | undefined): SectionShift | null {
  if (!shift?.trim()) return null

  const normalized = stripAccents(shift).toLowerCase().trim()
  if (SHIFT_ALIASES[normalized]) return SHIFT_ALIASES[normalized]

  for (const label of Object.values(SECTION_SHIFT_LETTERS)) {
    if (stripAccents(label).toLowerCase() === normalized) return label
  }

  return null
}

export function resolveSectionShift(section: {
  sectionCode: string
  shift: string | null
}): SectionShift | null {
  return normalizeShiftValue(section.shift) ?? shiftFromSectionCode(section.sectionCode)
}

export function formatSectionCodeWithShift(section: {
  sectionCode: string
  shift: string | null
}): string {
  const shift = resolveSectionShift(section)
  if (!shift) return section.sectionCode
  return `${section.sectionCode} · ${shift}`
}
