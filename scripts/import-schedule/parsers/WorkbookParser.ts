import { readFileSync } from 'node:fs'
import XLSX from 'xlsx'
import { classifySheetName } from '../config'
import { isEmptyValue, normalizeText } from '../normalizers/TextNormalizer'
import type { HeaderMap, ParsedSheetRow } from '../types'
import { lookupTeacherName, parseDocentesSheet } from './DocentesParser'
import { SheetParser } from './SheetParser'

export interface ParsedWorkbook {
  sheetNames: string[]
  sheets: Array<{
    name: string
    kind: ReturnType<typeof classifySheetName>
    ref: string
    rows: number
    cols: number
    mergedCells: number
    headerMap: HeaderMap | null
    parsedRows: ParsedSheetRow[]
    ignoredReason?: string
  }>
}

function sheetToMatrix(worksheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
    raw: true,
  }) as unknown[][]
}

export class WorkbookParser {
  private sheetParser = new SheetParser()

  parse(filePath: string, options?: { sheet?: string; allSheets?: boolean }): ParsedWorkbook {
    const buffer = readFileSync(filePath)
    // cellDates:false keeps Excel times as serial fractions (e.g. 0.75 = 18:00).
    // With cellDates:true they become Date objects; cellToRawString → toISOString()
    // then yields UTC clock times like 21:50 instead of the wall-clock 18:00.
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, dense: false })

    const docentesSheet = workbook.Sheets['Docentes']
    const teacherLookup = docentesSheet
      ? parseDocentesSheet(sheetToMatrix(docentesSheet))
      : new Map<string, string>()

    const targetSheets = options?.sheet
      ? [options.sheet]
      : options?.allSheets
        ? workbook.SheetNames
        : workbook.SheetNames.filter((name) => {
            const kind = classifySheetName(name)
            return kind === 'career' || kind === 'campus'
          })

    const sheets = targetSheets.map((name) => {
      const worksheet = workbook.Sheets[name]
      if (!worksheet) {
        return {
          name,
          kind: classifySheetName(name),
          ref: 'A1:A1',
          rows: 0,
          cols: 0,
          mergedCells: 0,
          headerMap: null,
          parsedRows: [],
          ignoredReason: 'Hoja no encontrada',
        }
      }

      const ref = worksheet['!ref'] ?? 'A1:A1'
      const range = XLSX.utils.decode_range(ref)
      const matrix = sheetToMatrix(worksheet)
      const parsed = this.sheetParser.parseSheet(name, matrix)

      const parsedRows =
        teacherLookup.size > 0
          ? parsed.rows.map((row) => enrichTeacherFromDocentes(row, teacherLookup))
          : parsed.rows

      return {
        name,
        kind: classifySheetName(name),
        ref,
        rows: range.e.r - range.s.r + 1,
        cols: range.e.c - range.s.c + 1,
        mergedCells: worksheet['!merges']?.length ?? 0,
        headerMap: parsed.headerMap,
        parsedRows,
        ignoredReason: parsed.ignoredReason,
      }
    })

    return { sheetNames: workbook.SheetNames, sheets }
  }
}

function enrichTeacherFromDocentes(
  row: ParsedSheetRow,
  teacherLookup: Map<string, string>,
): ParsedSheetRow {
  if (!isEmptyValue(row.teacherName)) {
    return row
  }

  const careerCode = row.careerSigla.rawValue.trim() || row.sheetName
  const teacher = lookupTeacherName(teacherLookup, {
    careerCode,
    courseName: row.courseName.rawValue,
    plan: row.plan.rawValue,
    shift: row.shift.rawValue,
  })

  if (!teacher) {
    return row
  }

  return {
    ...row,
    teacherName: normalizeText(teacher),
  }
}
