import { JSDOM } from 'jsdom'
import type { ScheduleLinkCandidate, ScheduleLinkKind } from './types'

const KEYWORDS = [
  'horario',
  'horarios',
  'clase',
  'clases',
  'examen',
  'examenes',
  'exámenes',
  'primer periodo',
  'segundo periodo',
  'version web',
  'versión web',
  'xlsx',
  'excel',
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function classifyHref(href: string): ScheduleLinkKind {
  const lower = href.toLowerCase()
  if (/drive\.google\.com\/drive\/folders\//.test(lower)) {
    return 'drive-folder'
  }
  if (/drive\.google\.com\/(file\/d\/|uc\?export=download|open\?|download)/.test(lower)) {
    return 'drive-file'
  }
  if (/\.(xlsx|xlsm?|ods)(\?|#|$)/.test(lower)) {
    return 'excel'
  }
  if (/\.(pdf)(\?|#|$)/.test(lower)) {
    return 'pdf'
  }
  if (/download|descargar/.test(lower)) {
    return 'download'
  }
  if (/^https?:\/\//.test(lower)) {
    return 'page'
  }
  return 'other'
}

function scoreCandidate(candidate: Omit<ScheduleLinkCandidate, 'score'>): number {
  const text = normalize(candidate.text)
  const context = normalize(candidate.context)
  const href = normalize(candidate.absoluteUrl)
  let score = 0

  if (candidate.kind === 'excel') score += 120
  if (candidate.kind === 'drive-file') score += 110
  if (candidate.kind === 'download') score += 90
  if (candidate.kind === 'drive-folder') score += 70
  if (candidate.kind === 'page') score += 20
  if (candidate.kind === 'pdf') score -= 100

  for (const keyword of KEYWORDS) {
    if (text.includes(keyword) || href.includes(keyword)) {
      score += 12
    }
  }

  if (!text && context) {
    for (const keyword of KEYWORDS) {
      if (context.includes(keyword)) {
        score += 4
      }
    }
  }

  if (text.includes('horario de clases') || text.includes('horarios de clases')) {
    score += 24
  }
  if (text.includes('primer periodo') || text.includes('segundo periodo')) {
    score += 18
  }
  if (text.includes('version web')) {
    score += 18
  }

  if (text.includes('2026') || href.includes('2026')) {
    score += 90
  }
  if (text.includes('2025') || href.includes('2025')) {
    score += 20
  }
  if (text.includes('2024') || href.includes('2024')) {
    score -= 10
  }
  if (text.includes('2023') || href.includes('2023')) {
    score -= 20
  }
  if (text.includes('2022') || href.includes('2022')) {
    score -= 30
  }

  return score
}

function contextText(element: Element | null): string {
  if (!element) return ''
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 280)
}

export function extractScheduleLinks(html: string, baseUrl: string): ScheduleLinkCandidate[] {
  const dom = new JSDOM(html)
  const { document } = dom.window
  const candidates: ScheduleLinkCandidate[] = []

  for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
    const href = anchor.getAttribute('href')?.trim()
    if (!href) continue
    const absoluteUrl = new URL(href, baseUrl).toString()
    const text = (anchor.textContent ?? '').replace(/\s+/g, ' ').trim()
    const context = contextText(anchor.closest('article, section, main, li, p, div') ?? anchor.parentElement)
    const candidate = {
      href,
      absoluteUrl,
      text,
      context,
      kind: classifyHref(absoluteUrl),
    }
    candidates.push({ ...candidate, score: scoreCandidate(candidate) })
  }

  for (const row of Array.from(document.querySelectorAll('tr[role="row"][data-id]'))) {
    const driveFileId = row.getAttribute('data-id')?.trim()
    if (!driveFileId) continue
    const text = (row.textContent ?? '').replace(/\s+/g, ' ').trim()
    const strongText = (row.querySelector('strong')?.textContent ?? '').replace(/\s+/g, ' ').trim()
    const labelText = strongText || text.split('Compartido')[0]?.trim() || text
    if (!text || !/xlsx|excel|horario|clase|examen/i.test(text)) continue

    const absoluteUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`
    const candidate = {
      href: absoluteUrl,
      absoluteUrl,
      text: labelText,
      context: text,
      kind: 'drive-file' as const,
      driveFileId,
    }
    candidates.push({ ...candidate, score: scoreCandidate(candidate) + 10 })
  }

  return candidates
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
}

export function selectBestScheduleLink(candidates: ScheduleLinkCandidate[]): {
  candidate: ScheduleLinkCandidate | null
  reason: string
} {
  const prioritized = candidates
    .filter((candidate) => candidate.kind !== 'pdf')
    .filter((candidate) => /horario|clase|examen|periodo|version web|xlsx|excel/i.test(
      `${candidate.text} ${candidate.context} ${candidate.absoluteUrl}`,
    ))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      const priority = (kind: ScheduleLinkKind): number => {
        if (kind === 'excel') return 0
        if (kind === 'drive-file') return 1
        if (kind === 'download') return 2
        if (kind === 'drive-folder') return 3
        if (kind === 'page') return 4
        return 5
      }
      return priority(left.kind) - priority(right.kind)
    })

  const candidate = prioritized[0] ?? null
  return {
    candidate,
    reason: candidate
      ? `Elegido por heurística: ${candidate.kind} con puntaje ${candidate.score}`
      : 'No se encontró un enlace de horario confiable',
  }
}
