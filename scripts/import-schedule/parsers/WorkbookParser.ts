import { readFileSync } from 'node:fs'
import XLSX from 'xlsx'
import { classifySheetName } from '../config'
import type { HeaderMap, ParsedSheetRow } from '../types'
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

export class WorkbookParser {
  private sheetParser = new SheetParser()

  parse(filePath: string, options?: { sheet?: string; allSheets?: boolean }): ParsedWorkbook {
    const buffer = readFileSync(filePath)
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, dense: false })

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
      const matrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false,
        raw: true,
      }) as unknown[][]

      const parsed = this.sheetParser.parseSheet(name, matrix)

      return {
        name,
        kind: classifySheetName(name),
        ref,
        rows: range.e.r - range.s.r + 1,
        cols: range.e.c - range.s.c + 1,
        mergedCells: worksheet['!merges']?.length ?? 0,
        headerMap: parsed.headerMap,
        parsedRows: parsed.rows,
        ignoredReason: parsed.ignoredReason,
      }
    })

    return { sheetNames: workbook.SheetNames, sheets }
  }
}
