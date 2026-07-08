import type { CurriculumCourse, MatchConfidence } from '@/types/academicHistory'
import { parseElectiveCourseName } from '@/utils/electiveCourses'

const ROMAN_MAP: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
}

export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
}

export function normalizeCourseName(value: string): string {
  let text = stripAccents(value).toUpperCase().trim()
  text = text.replace(/\s+/g, ' ')
  text = text.replace(/\b(\d+)\s*(ER|DO|TO|MO|VO|NO)\b/g, (_, num, suffix) => {
    const map: Record<string, string> = {
      ER: '1',
      DO: '2',
      TO: '3',
      MO: '4',
      VO: '5',
      NO: '9',
    }
    return `${num}${map[suffix] ?? ''}`
  })
  text = text.replace(/\b(I{1,3}|IV|VI{0,3}|IX|X)\b/g, (roman) => String(ROMAN_MAP[roman] ?? roman))
  text = text.replace(/[^\w\s]/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

export function parseElectiveSlot(name: string): {
  slot: string | null
  specificName: string | null
} {
  return parseElectiveCourseName(name)
}

function tokenOverlap(a: string, b: string): number {
  const tokensA = new Set(normalizeCourseName(a).split(' ').filter(Boolean))
  const tokensB = new Set(normalizeCourseName(b).split(' ').filter(Boolean))
  if (tokensA.size === 0 || tokensB.size === 0) return 0
  let overlap = 0
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap++
  }
  return overlap / Math.max(tokensA.size, tokensB.size)
}

export function matchCourseToCatalog(
  courseName: string,
  catalog: CurriculumCourse[],
): { courseId: string | null; confidence: MatchConfidence } {
  const normalized = normalizeCourseName(courseName)
  const { slot } = parseElectiveSlot(courseName)

  if (slot) {
    const slotCourse = catalog.find(
      (c) => c.electiveSlot && normalizeCourseName(c.electiveSlot) === normalizeCourseName(slot),
    )
    if (slotCourse) return { courseId: slotCourse.id, confidence: 'exact' }
  }

  const exact = catalog.find((c) => normalizeCourseName(c.name) === normalized)
  if (exact) return { courseId: exact.id, confidence: 'exact' }

  let best: { course: CurriculumCourse; score: number } | null = null
  for (const course of catalog) {
    const score = tokenOverlap(courseName, course.name)
    if (!best || score > best.score) best = { course, score }
  }

  if (best && best.score >= 0.75) {
    return { courseId: best.course.id, confidence: 'probable' }
  }

  if (best && best.score >= 0.5) {
    return { courseId: best.course.id, confidence: 'probable' }
  }

  return { courseId: null, confidence: 'none' }
}

export function parseGradeToken(token: string): number | null {
  const digit = token.match(/\b([1-5])\b/)
  if (digit) return Number(digit[1])

  const words: Record<string, number> = {
    UNO: 1,
    DOS: 2,
    TRES: 3,
    CUATRO: 4,
    CINCO: 5,
  }
  const upper = stripAccents(token).toUpperCase()
  for (const [word, grade] of Object.entries(words)) {
    if (upper.includes(word)) return grade
  }
  return null
}

export function parseDateToken(token: string): string | null {
  const match = token.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}
