import type { AttemptStatus, CurriculumCourse, TranscriptParseRow } from '@/types/academicHistory'
import { deriveAttemptStatus } from '@/utils/academicApproval'
import {
  parseDateToken,
  parseElectiveSlot,
  parseGradeToken,
  normalizeCourseName,
  matchCourseToCatalog,
} from '@/utils/courseMatching'

const SEMESTER_RE =
  /^(\d+)(ER|DO|TO|MO|VO|NO)\.\s*SEMESTRE/i

const COURSE_LINE_RE =
  /^(\d+)\)\s*(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d+)\s+(\d+)\s+(.+)$/i

const EXTENSION_RE = /creditos?\s+en\s+actividades?\s+de\s+extension/i

export function parseTranscriptText(
  text: string,
  catalog: CurriculumCourse[],
): { rows: TranscriptParseRow[]; gpa: number | null } {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows: TranscriptParseRow[] = []
  let currentSemester: number | null = null
  let gpa: number | null = null
  const seenKeys = new Map<string, number>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!

    const gpaMatch = line.match(/PROMEDIO:\s*([\d.,]+)/i)
    if (gpaMatch) {
      gpa = Number(gpaMatch[1]!.replace(',', '.'))
      continue
    }

    const semesterMatch = line.match(SEMESTER_RE)
    if (semesterMatch) {
      currentSemester = Number(semesterMatch[1])
      continue
    }

    if (EXTENSION_RE.test(line)) {
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/)
      rows.push({
        rowIndex: i,
        originalCourseName: line,
        normalizedCourseName: normalizeCourseName('Créditos de Extensión Universitaria'),
        semesterNumber: null,
        semesterLabel: 'Extensión Universitaria',
        examDate: dateMatch ? parseDateToken(dateMatch[0]) : null,
        status: 'passed',
        isExtension: true,
        matchConfidence: 'exact',
        warnings: [],
        ignored: false,
        matchedCourseId: catalog.find((c) => c.type === 'extension')?.id ?? null,
      })
      continue
    }

    const courseMatch = line.match(COURSE_LINE_RE)
    if (!courseMatch) continue

    const originalName = courseMatch[2]!.trim()
    const examDate = parseDateToken(courseMatch[3]!)
    const recordNumber = courseMatch[4]!
    const score = Number(courseMatch[5])
    const grade = parseGradeToken(courseMatch[6]!)
    const status: AttemptStatus = deriveAttemptStatus(grade)
    const { slot, specificName } = parseElectiveSlot(originalName)
    const normalized = normalizeCourseName(originalName)
    const { courseId, confidence } = matchCourseToCatalog(originalName, catalog)

    const key = `${normalizeCourseName(originalName)}|${examDate ?? ''}|${grade ?? ''}`
    const prevCount = seenKeys.get(key) ?? 0
    seenKeys.set(key, prevCount + 1)

    const warnings: string[] = []
    let matchConfidence = confidence
    if (prevCount > 0) matchConfidence = 'duplicate'
    if (
      rows.some(
        (r) =>
          !r.ignored &&
          r.normalizedCourseName === normalized &&
          r.examDate !== examDate,
      )
    ) {
      matchConfidence = 'repeated_attempt'
    }
    if (!courseId) warnings.push('Sin coincidencia en el plan de estudios')
    if (grade == null) warnings.push('No se detectó la nota')

    rows.push({
      rowIndex: i,
      originalCourseName: originalName,
      normalizedCourseName: normalized,
      semesterNumber: currentSemester,
      examDate,
      recordNumber,
      score: Number.isFinite(score) ? score : null,
      finalGrade: grade,
      status,
      electiveSlot: slot,
      specificElectiveName: specificName,
      matchedCourseId: courseId,
      matchConfidence,
      warnings,
      ignored: false,
    })
  }

  return { rows, gpa }
}

export async function extractTextFromPdfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // PDF con texto embebido: extraer streams legibles sin dependencia externa.
  const raw = new TextDecoder('latin1').decode(bytes)
  const chunks: string[] = []

  const parenMatches = raw.matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g)
  for (const match of parenMatches) {
    const decoded = match[1]!
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
    if (decoded.trim().length > 2) chunks.push(decoded)
  }

  const streamText = chunks.join('\n')
  if (streamText.replace(/\s/g, '').length > 80) {
    return streamText
  }

  // Fallback: texto visible en el binario (PDFs simples)
  const ascii = raw
    .replace(/[^\x20-\x7E\n\rÁÉÍÓÚÑáéíóúñüÜ]/g, ' ')
    .replace(/\s+/g, ' ')
  return ascii
}
