import { IMPORTER_CONFIG } from '../config'
import type { HeaderMap, ExamColumnGroup, WeekdayColumnGroup } from '../types'
import { normalizeComparable } from '../normalizers/TextNormalizer'

const DAY_LABELS: Array<{ label: string; dayOfWeek: number; aliases: string[] }> = [
  { label: 'Lunes', dayOfWeek: 1, aliases: ['lunes'] },
  { label: 'Martes', dayOfWeek: 2, aliases: ['martes'] },
  { label: 'Miércoles', dayOfWeek: 3, aliases: ['miercoles', 'miércoles'] },
  { label: 'Jueves', dayOfWeek: 4, aliases: ['jueves'] },
  { label: 'Viernes', dayOfWeek: 5, aliases: ['viernes'] },
  { label: 'Sábado', dayOfWeek: 6, aliases: ['sabado', 'sábado'] },
]

function findColumn(row: unknown[], aliases: string[]): number | undefined {
  for (let index = 0; index < row.length; index += 1) {
    const text = normalizeComparable(row[index])
    if (!text) continue
    if (aliases.some((alias) => text === alias || text.includes(alias))) {
      return index
    }
  }
  return undefined
}

function detectFormat(secondaryRow: unknown[], _primaryRow: unknown[]): HeaderMap['format'] {
  const hasMonday = findColumn(secondaryRow, ['lunes']) != null
  const examDayCount = secondaryRow.filter((cell) => normalizeComparable(cell) === 'dia').length
  if (hasMonday && examDayCount >= 5) {
    return 'standard'
  }
  return 'villarrica'
}

function buildExamGroups(
  primaryRow: unknown[],
  secondaryRow: unknown[],
  format: HeaderMap['format'],
): ExamColumnGroup[] {
  const examTypes: Array<{ type: string; labels: string[] }> = [
    { type: 'partial1', labels: [...IMPORTER_CONFIG.examGroupAliases.partial1] },
    { type: 'partial2', labels: [...IMPORTER_CONFIG.examGroupAliases.partial2] },
    { type: 'final1', labels: [...IMPORTER_CONFIG.examGroupAliases.final1] },
    { type: 'revision1', labels: [...IMPORTER_CONFIG.examGroupAliases.revision1] },
    { type: 'final2', labels: [...IMPORTER_CONFIG.examGroupAliases.final2] },
    { type: 'revision2', labels: [...IMPORTER_CONFIG.examGroupAliases.revision2] },
    { type: 'board', labels: [...IMPORTER_CONFIG.examGroupAliases.board] },
  ]

  // Locate each exam block by its primary header, advancing only past the label.
  // Column ownership is bounded by the next block (or Monday), so "Revisión"
  // cannot steal AULA from "2do. Final" / "Mesa Examinadora".
  const starts: Array<{ type: string; label: string; startCol: number }> = []
  let searchStart = 0
  for (const examType of examTypes) {
    for (let col = searchStart; col < primaryRow.length; col += 1) {
      const label = normalizeComparable(primaryRow[col])
      if (examType.labels.some((candidate) => label.includes(candidate))) {
        starts.push({
          type: examType.type,
          label: String(primaryRow[col] ?? examType.type),
          startCol: col,
        })
        searchStart = col + 1
        break
      }
    }
  }

  const mondayCol = findColumn(secondaryRow, ['lunes'])
  const groups: ExamColumnGroup[] = []

  for (let index = 0; index < starts.length; index += 1) {
    const current = starts[index]!
    const nextStart = starts[index + 1]?.startCol
    const endCol = (nextStart ?? mondayCol ?? secondaryRow.length) - 1
    if (endCol < current.startCol) continue

    if (current.type === 'board') {
      const presidentCol = findColumnInRange(
        secondaryRow,
        ['presidente'],
        current.startCol,
        endCol,
      )
      const memberCols: number[] = []
      for (let col = current.startCol; col <= endCol; col += 1) {
        if (normalizeComparable(secondaryRow[col]) === 'miembro') {
          memberCols.push(col)
        }
      }
      const boardMemberCols = [
        ...(presidentCol != null ? [presidentCol] : [current.startCol]),
        ...memberCols,
      ].slice(0, 3)
      groups.push({
        examType: current.type,
        label: current.label,
        boardMemberCols,
        classroomCol:
          format === 'standard'
            ? findColumnInRange(secondaryRow, ['aula'], current.startCol, endCol)
            : undefined,
      })
      continue
    }

    const dateCol = findColumnInRange(secondaryRow, ['dia', 'día'], current.startCol, endCol)
    const timeCol = findColumnInRange(secondaryRow, ['hora'], current.startCol, endCol)
    const classroomCol =
      format === 'standard'
        ? findColumnInRange(secondaryRow, ['aula'], current.startCol, endCol)
        : undefined

    if (dateCol != null || timeCol != null) {
      groups.push({
        examType: current.type,
        label: current.label,
        dateCol,
        timeCol,
        classroomCol,
      })
    }
  }

  return groups
}

function findColumnInRange(
  row: unknown[],
  aliases: string[],
  start: number,
  end: number,
): number | undefined {
  for (let col = start; col <= end && col < row.length; col += 1) {
    const text = normalizeComparable(row[col])
    if (aliases.some((alias) => text === alias)) {
      return col
    }
  }
  return undefined
}

function buildWeekdayGroups(secondaryRow: unknown[], format: HeaderMap['format']): WeekdayColumnGroup[] {
  const groups: WeekdayColumnGroup[] = []

  for (const day of DAY_LABELS) {
    const scheduleCol = findColumn(secondaryRow, day.aliases)
    if (scheduleCol == null) continue

    const classroomCol =
      format === 'standard'
        ? secondaryRow
            .slice(scheduleCol + 1, scheduleCol + 3)
            .findIndex((cell) => normalizeComparable(cell) === 'aula') + scheduleCol + 1
        : undefined

    groups.push({
      dayOfWeek: day.dayOfWeek,
      label: day.label,
      scheduleCol,
      classroomCol: classroomCol && classroomCol > scheduleCol ? classroomCol : undefined,
    })
  }

  return groups
}

export function detectHeaderMap(matrix: unknown[][]): HeaderMap | null {
  let best: { score: number; primary: number; secondary: number } | null = null

  for (let rowIndex = 0; rowIndex < Math.min(matrix.length, 20); rowIndex += 1) {
    const row = matrix[rowIndex] ?? []
    // Prefer the secondary header row (Item/Asignatura/Lunes...). Avoid scoring
    // "1er. Final" on the primary group row as if it were the column header row.
    const score = [
      'asignatura',
      'seccion',
      'turno',
      'docente',
      'lunes',
      'item',
      'hora',
    ].reduce((total, token) => {
      const matches = row.some((cell) => {
        const text = normalizeComparable(cell)
        return text === token || (token !== 'item' && text.includes(token))
      })
      return total + (matches ? 1 : 0)
    }, 0)

    if (!best || score > best.score) {
      best = { score, primary: Math.max(0, rowIndex - 1), secondary: rowIndex }
    }
  }

  if (!best || best.score < 3) {
    return null
  }

  const primaryRow = matrix[best.primary] ?? []
  const secondaryRow = matrix[best.secondary] ?? []
  const format = detectFormat(secondaryRow, primaryRow)

  // No usar defaults para columnas de docente: en el formato 2026-2 no existen
  // y caer en 11–14 pisaría fechas de evaluación/examen.
  const columns = {
    item: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.item) ?? 0,
    department: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.department) ?? 1,
    courseName: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.courseName) ?? 2,
    level: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.level) ?? 3,
    semesterGroup: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.semesterGroup) ?? 4,
    careerCode: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.careerCode) ?? 5,
    emphasis: findColumn(secondaryRow, ['enfasis', 'énfasis']) ?? 6,
    plan: findColumn(secondaryRow, ['plan']) ?? 7,
    shift: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.shift) ?? 8,
    sectionCode: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.sectionCode) ?? 9,
    teacherTitle: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.teacherTitle),
    teacherLastName: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.teacherLastName),
    teacherFirstName: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.teacherFirstName),
    teacherEmail: findColumn(secondaryRow, IMPORTER_CONFIG.headerAliases.teacherEmail),
  }

  const weekdays = buildWeekdayGroups(secondaryRow, format)
  const exams = buildExamGroups(primaryRow, secondaryRow, format)
  const specialSaturdayDatesCol = findColumn(secondaryRow, ['fechas de clases de sabados'])

  return {
    format,
    headerRows: [best.primary, best.secondary],
    dataStartRow: best.secondary + 1,
    columns,
    weekdays,
    exams,
    specialSaturdayDatesCol,
  }
}

export function getCellValue(row: unknown[], columnIndex: number | undefined): unknown {
  if (columnIndex == null || columnIndex < 0) {
    return null
  }
  return row[columnIndex] ?? null
}
