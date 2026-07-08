import { IMPORTER_CONFIG } from '../config'
import type { ImportIssue, NormalizedImportBundle } from '../types'

export class ImportValidator {
  validate(bundle: NormalizedImportBundle, previousCounts?: {
    courses: number
    sections: number
  }): ImportIssue[] {
    const issues: ImportIssue[] = [...bundle.warnings, ...bundle.duplicates]

    if (bundle.careers.length === 0) {
      issues.push({
        code: 'NO_CAREERS',
        message: 'No se encontraron carreras',
        severity: 'critical',
      })
    }

    if (bundle.courses.length < IMPORTER_CONFIG.thresholds.minCourses) {
      issues.push({
        code: 'MIN_COURSES',
        message: `Materias insuficientes (${bundle.courses.length})`,
        severity: 'critical',
      })
    }

    if (bundle.sections.length < IMPORTER_CONFIG.thresholds.minSections) {
      issues.push({
        code: 'MIN_SECTIONS',
        message: `Secciones insuficientes (${bundle.sections.length})`,
        severity: 'critical',
      })
    }

    const totalRows = bundle.sections.length + bundle.rejectedRows.length
    const rejectedPercent =
      totalRows === 0 ? 0 : (bundle.rejectedRows.length / totalRows) * 100
    if (rejectedPercent > IMPORTER_CONFIG.thresholds.maxRejectedRowsPercent) {
      issues.push({
        code: 'MAX_REJECTED_ROWS',
        message: `Filas rechazadas ${rejectedPercent.toFixed(1)}%`,
        severity: 'critical',
      })
    }

    if (previousCounts) {
      const courseDrop =
        previousCounts.courses === 0
          ? 0
          : ((previousCounts.courses - bundle.courses.length) / previousCounts.courses) * 100
      const sectionDrop =
        previousCounts.sections === 0
          ? 0
          : ((previousCounts.sections - bundle.sections.length) / previousCounts.sections) *
            100

      if (
        courseDrop > IMPORTER_CONFIG.thresholds.maxDropPercent ||
        sectionDrop > IMPORTER_CONFIG.thresholds.maxDropPercent
      ) {
        issues.push({
          code: 'MAX_DROP_PERCENT',
          message: `Caída drástica detectada (cursos ${courseDrop.toFixed(1)}%, secciones ${sectionDrop.toFixed(1)}%)`,
          severity: 'critical',
        })
      }
    }

    for (const rejected of bundle.rejectedRows) {
      if (rejected.severity === 'critical') {
        issues.push({
          code: 'REJECTED_ROW',
          message: rejected.reason,
          severity: 'critical',
          sheetName: rejected.sheetName,
          rowNumber: rejected.rowNumber,
        })
      }
    }

    return issues
  }

  hasCriticalErrors(issues: ImportIssue[]): boolean {
    return issues.some((issue) => issue.severity === 'critical')
  }
}
