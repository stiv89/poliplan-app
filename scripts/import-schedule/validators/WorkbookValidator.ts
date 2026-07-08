import type { ParsedWorkbook } from '../parsers/WorkbookParser'
import type { ImportIssue } from '../types'

export class WorkbookValidator {
  validate(workbook: ParsedWorkbook): ImportIssue[] {
    const issues: ImportIssue[] = []
    const validSheets = workbook.sheets.filter(
      (sheet) => sheet.headerMap && sheet.parsedRows.length > 0,
    )

    if (validSheets.length === 0) {
      issues.push({
        code: 'NO_VALID_SHEETS',
        message: 'El workbook no contiene hojas académicas válidas',
        severity: 'critical',
      })
    }

    for (const sheet of workbook.sheets) {
      if (sheet.ignoredReason) {
        issues.push({
          code: 'SHEET_IGNORED',
          message: `Hoja ${sheet.name}: ${sheet.ignoredReason}`,
          severity: 'warning',
          sheetName: sheet.name,
        })
      }
    }

    return issues
  }
}
