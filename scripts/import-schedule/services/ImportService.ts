import { classifySheetName } from '../config'
import { LocalFileSource } from '../sources/LocalFileSource'
import { WorkbookParser } from '../parsers/WorkbookParser'
import { normalizeWorkbookRows } from '../normalizers/WorkbookNormalizer'
import { WorkbookValidator } from '../validators/WorkbookValidator'
import { ImportValidator } from '../validators/ImportValidator'
import { ConsoleReporter } from '../reporters/ConsoleReporter'
import { JsonReporter } from '../reporters/JsonReporter'
import {
  NoopImportRepository,
  SupabaseImportRepository,
} from '../repositories/SupabaseImportRepository'
import type { ImportCliOptions, ImportReport, ScheduleImportRepository } from '../types'

export class ImportService {
  constructor(
    private repository: ScheduleImportRepository = new NoopImportRepository(),
    private workbookParser = new WorkbookParser(),
    private workbookValidator = new WorkbookValidator(),
    private importValidator = new ImportValidator(),
    private consoleReporter = new ConsoleReporter(),
    private jsonReporter = new JsonReporter(),
    private fileSource = new LocalFileSource(),
  ) {}

  async run(options: ImportCliOptions): Promise<ImportReport> {
    const source = await this.fileSource.load(options.filePath)
    const workbook = this.workbookParser.parse(source.filePath, {
      sheet: options.sheet,
      allSheets: options.allSheets,
    })

    const workbookIssues = this.workbookValidator.validate(workbook)
    const parsedRows = workbook.sheets.flatMap((sheet) => sheet.parsedRows)
    const sheetsProcessed = workbook.sheets
      .filter((sheet) => sheet.parsedRows.length > 0)
      .map((sheet) => sheet.name)
    const sheetsIgnored = workbook.sheets
      .filter((sheet) => sheet.parsedRows.length === 0)
      .map((sheet) => `${sheet.name}${sheet.ignoredReason ? ` (${sheet.ignoredReason})` : ''}`)

    const bundle = normalizeWorkbookRows({
      source,
      rows: parsedRows,
      academicPeriodId: options.periodId ?? null,
      sheetsProcessed,
      sheetsIgnored,
    })

    let previousCounts: { courses: number; sections: number } | undefined
    if (!options.dryRun && options.periodId && !options.skipUpload) {
      previousCounts = await this.repository.getCurrentCounts(options.periodId)
    }

    const validationIssues = this.importValidator.validate(bundle, previousCounts)
    const allIssues = [...workbookIssues, ...validationIssues]
    const criticalErrors = allIssues.filter((issue) => issue.severity === 'critical').length

    const report: ImportReport = {
      ...bundle,
      warnings: [...bundle.warnings, ...allIssues.filter((issue) => issue.severity === 'warning')],
      summary: {
        careers: bundle.careers.length,
        courses: bundle.courses.length,
        sections: bundle.sections.length,
        meetings: bundle.meetings.length,
        exams: bundle.exams.length,
        validRows: bundle.sections.length,
        rejectedRows: bundle.rejectedRows.length,
        warnings: allIssues.filter((issue) => issue.severity === 'warning').length,
        criticalErrors,
        duplicates: bundle.duplicates.length,
      },
    }

    if (!options.dryRun && !options.skipUpload) {
      if (!options.periodId) {
        throw new Error('--period-id es obligatorio para importación real')
      }

      if (this.importValidator.hasCriticalErrors(allIssues)) {
        throw new Error('Importación abortada por errores críticos')
      }

      const exists = await this.repository.findExistingChecksum(source.checksum)
      if (exists && !options.force) {
        throw new Error('Checksum ya importado. Usá --force para reimportar.')
      }

      await this.repository.importBundle({
        academicPeriodId: options.periodId,
        checksum: source.checksum,
        fileName: source.fileName,
        bundle,
      })
    }

    this.consoleReporter.print(report, options.verbose)

    if (options.output) {
      await this.jsonReporter.write(report, options.output)
    }

    return report
  }
}

export function createImportService(options: ImportCliOptions): ImportService {
  const repository =
    options.dryRun || options.skipUpload
      ? new NoopImportRepository()
      : new SupabaseImportRepository()
  return new ImportService(repository)
}

import { basename } from 'node:path'

export function inferDefaultOutputPath(sourceFilePath: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const base = basename(sourceFilePath)
    .replace(/\.[^.]+$/, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
  return `./reports/import-${base}-${stamp}.json`
}

export function listWorkbookOverview(filePath: string): void {
  const parser = new WorkbookParser()
  const workbook = parser.parse(filePath, { allSheets: true })
  console.log(`Workbook: ${filePath}`)
  for (const sheet of workbook.sheets) {
    console.log(
      `- ${sheet.name} [${classifySheetName(sheet.name)}] ${sheet.rows}x${sheet.cols} rowsParsed=${sheet.parsedRows.length} format=${sheet.headerMap?.format ?? 'n/a'}`,
    )
  }
}
