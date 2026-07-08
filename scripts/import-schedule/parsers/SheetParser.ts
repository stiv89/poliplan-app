import { classifySheetName } from '../config'
import type { HeaderMap, ParsedSheetRow } from '../types'
import { detectHeaderMap, getCellValue } from './HeaderDetector'
import { cellToRawString, isEmptyValue, joinTeacherName, normalizeText } from '../normalizers/TextNormalizer'

export class SheetParser {
  parseSheet(sheetName: string, matrix: unknown[][]): {
    headerMap: HeaderMap | null
    rows: ParsedSheetRow[]
    ignoredReason?: string
  } {
    const sheetKind = classifySheetName(sheetName)
    if (sheetKind !== 'career' && sheetKind !== 'campus') {
      return {
        headerMap: null,
        rows: [],
        ignoredReason: `Hoja clasificada como ${sheetKind}`,
      }
    }

    const headerMap = detectHeaderMap(matrix)
    if (!headerMap) {
      return { headerMap: null, rows: [], ignoredReason: 'No se detectaron encabezados válidos' }
    }

    const rows: ParsedSheetRow[] = []
    for (let rowIndex = headerMap.dataStartRow; rowIndex < matrix.length; rowIndex += 1) {
      const row = matrix[rowIndex] ?? []
      const courseName = normalizeText(getCellValue(row, headerMap.columns.courseName))
      const sectionCode = normalizeText(getCellValue(row, headerMap.columns.sectionCode))

      if (isEmptyValue(courseName) && isEmptyValue(sectionCode)) {
        continue
      }

      if (isEmptyValue(courseName)) {
        continue
      }

      const teacherName = joinTeacherName([
        normalizeText(getCellValue(row, headerMap.columns.teacherTitle)),
        normalizeText(getCellValue(row, headerMap.columns.teacherLastName)),
        normalizeText(getCellValue(row, headerMap.columns.teacherFirstName)),
      ])

      rows.push({
        sheetName,
        sheetKind,
        rowNumber: rowIndex + 1,
        careerCode: sheetName,
        department: normalizeText(getCellValue(row, headerMap.columns.department)),
        courseName,
        level: normalizeText(getCellValue(row, headerMap.columns.level)),
        semesterGroup: normalizeText(getCellValue(row, headerMap.columns.semesterGroup)),
        careerSigla: normalizeText(getCellValue(row, headerMap.columns.careerCode)),
        shift: normalizeText(getCellValue(row, headerMap.columns.shift)),
        sectionCode,
        teacherName: normalizeText(teacherName),
        teacherEmail: normalizeText(getCellValue(row, headerMap.columns.teacherEmail)),
        weekdayCells: headerMap.weekdays.map((weekday) => ({
          dayOfWeek: weekday.dayOfWeek,
          label: weekday.label,
          schedule: normalizeText(getCellValue(row, weekday.scheduleCol)),
          classroom: normalizeText(getCellValue(row, weekday.classroomCol)),
        })),
        examCells: headerMap.exams.map((exam) => ({
          examType: exam.examType,
          label: exam.label,
          date: normalizeText(getCellValue(row, exam.dateCol)),
          time: normalizeText(getCellValue(row, exam.timeCol)),
          classroom: normalizeText(getCellValue(row, exam.classroomCol)),
          boardMembers:
            exam.boardMemberCols?.map((col) => normalizeText(getCellValue(row, col))) ?? [],
        })),
        specialSaturdayDates: headerMap.specialSaturdayDatesCol
          ? normalizeText(getCellValue(row, headerMap.specialSaturdayDatesCol))
          : undefined,
      })
    }

    return { headerMap, rows }
  }
}

export function isLikelyDataRow(row: ParsedSheetRow): boolean {
  return !isEmptyValue(row.courseName)
}

export { cellToRawString }
