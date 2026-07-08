import { stripAccents } from '@/utils/courseMatching'
import { getSectionSearchLabel } from '@/utils/electiveCourses'
import type { CourseSection } from '@/types/academic'

export function normalizeSearchText(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0
  if (left.length === 0) return right.length
  if (right.length === 0) return left.length

  const matrix: number[][] = Array.from({ length: left.length + 1 }, (_, row) =>
    Array.from({ length: right.length + 1 }, (_, col) => (row === 0 ? col : col === 0 ? row : 0)),
  )

  for (let row = 1; row <= left.length; row += 1) {
    const currentRow = matrix[row]!
    const previousRow = matrix[row - 1]!
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1
      currentRow[col] = Math.min(
        previousRow[col]! + 1,
        currentRow[col - 1]! + 1,
        previousRow[col - 1]! + cost,
      )
    }
  }

  return matrix[left.length]![right.length]!
}

function isSubsequence(needle: string, haystack: string): boolean {
  if (!needle) return true
  let index = 0
  for (const char of haystack) {
    if (char === needle[index]) {
      index += 1
      if (index === needle.length) return true
    }
  }
  return false
}

function maxTypoDistance(length: number): number {
  if (length <= 3) return 0
  if (length <= 5) return 1
  if (length <= 8) return 2
  return 3
}

function scoreToken(queryToken: string, text: string, textTokens: string[]): number {
  let best = 0

  for (const token of textTokens) {
    if (token === queryToken) best = Math.max(best, 100)
    else if (token.startsWith(queryToken)) best = Math.max(best, 92)
    else if (queryToken.length >= 2 && token.includes(queryToken)) best = Math.max(best, 78)

    const distance = levenshteinDistance(queryToken, token)
    const allowed = maxTypoDistance(queryToken.length)
    if (distance <= allowed) {
      best = Math.max(best, 88 - distance * 14)
    }
  }

  if (isSubsequence(queryToken, text)) {
    best = Math.max(best, 62)
  }

  const wholeDistance = levenshteinDistance(queryToken, text)
  const wholeAllowed = maxTypoDistance(queryToken.length)
  if (wholeDistance <= wholeAllowed) {
    best = Math.max(best, 72 - wholeDistance * 12)
  }

  return best
}

export function scoreFuzzyMatch(query: string, text: string): number {
  const normalizedQuery = normalizeSearchText(query)
  const normalizedText = normalizeSearchText(text)

  if (!normalizedQuery) return 100
  if (!normalizedText) return 0

  if (normalizedText.includes(normalizedQuery)) {
    if (normalizedText.startsWith(normalizedQuery)) return 100
    if (normalizedText.split(' ').some((token) => token.startsWith(normalizedQuery))) return 96
    return 88
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean)
  const textTokens = normalizedText.split(' ').filter(Boolean)

  if (queryTokens.length === 0) return 0

  const tokenAverage =
    queryTokens.reduce((sum, token) => sum + scoreToken(token, normalizedText, textTokens), 0) /
    queryTokens.length

  return tokenAverage
}

export function filterAndRankByFuzzySearch<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  minScore = 45,
): T[] {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return items

  return items
    .map((item) => ({ item, score: scoreFuzzyMatch(trimmedQuery, getText(item)) }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score || getText(a.item).localeCompare(getText(b.item)))
    .map(({ item }) => item)
}

export function buildSectionSearchText(
  section: Pick<CourseSection, 'sectionCode' | 'teacherName' | 'specificElectiveName'>,
  course?: { name: string; code: string | null } | null,
): string {
  return getSectionSearchLabel(section, course)
}
