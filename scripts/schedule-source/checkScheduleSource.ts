import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { DEFAULT_ACADEMIC_PERIOD_ID, loadAdminEnv } from '../admin/load-env.ts'
import { createImportService } from '../import-schedule/services/ImportService'
import { fetchOfficialPage } from './fetchOfficialPage'
import { extractScheduleLinks, selectBestScheduleLink } from './extractScheduleLinks'
import { resolveScheduleTarget } from './resolveDriveLink'
import { downloadScheduleFile } from './downloadScheduleFile'
import { calculateSha256 } from './checksum'
import { validateDownloadedFile } from './validateDownloadedFile'
import { compareWithSupabase } from './supabase'
import type {
  ScheduleSourceCheckOptions,
  ScheduleSourceReport,
  ScheduleDryRunSummary,
} from './types'

export interface ScheduleSourceDeps {
  fetchImpl?: typeof fetch
  compareWithSupabase?: typeof compareWithSupabase
}

function printSummary(report: ScheduleSourceReport): void {
  console.log('\n=== PoliPlan Schedule Source Check ===')
  console.log(`URL consultada: ${report.page.requestedUrl}`)
  console.log(`URL final: ${report.page.finalUrl}`)
  console.log(`Código HTTP: ${report.page.status}`)
  console.log(`Tipo de contenido: ${report.page.contentType || 'n/a'}`)
  console.log(`Título: ${report.page.title || 'n/a'}`)
  console.log(`Enlaces encontrados: ${report.linksFound.length}`)

  for (const link of report.linksFound.slice(0, 20)) {
    console.log(`  - [${link.kind}] ${link.absoluteUrl} | ${link.text || '(sin texto)'} | score=${link.score}`)
  }

  if (report.selectedLink) {
    console.log(`Enlace elegido: ${report.selectedLink.absoluteUrl}`)
    console.log(`Nombre detectado: ${report.selectedLink.text || 'n/a'}`)
  }

  if (report.resolvedTarget) {
    console.log(`URL final de descarga: ${report.resolvedTarget.finalUrl}`)
    console.log(`Saltos resueltos: ${report.resolvedTarget.hops.join(' -> ')}`)
  }

  if (report.file) {
    console.log(`Archivo descargado: ${report.file.fileName}`)
    console.log(`Tipo MIME: ${report.file.mimeType}`)
    console.log(`Tamaño: ${report.file.sizeBytes}`)
    console.log(`Hojas: ${report.file.sheetCount}`)
    console.log(`Hojas académicas: ${report.file.academicSheetCount}`)
    console.log(`Checksum SHA-256: ${report.checksum ?? 'n/a'}`)
  }

  console.log(`Ya procesado: ${report.supabase.alreadyProcessed ? 'sí' : 'no'}`)
  if (report.supabase.available) {
    console.log(`Último checksum exitoso: ${report.supabase.lastSuccessfulChecksum ?? 'n/a'}`)
    console.log(
      `Última versión activa: ${report.supabase.lastActiveVersion ? `${report.supabase.lastActiveVersion.version} (${report.supabase.lastActiveVersion.checksum ?? 'sin checksum'})` : 'n/a'}`,
    )
    console.log(
      `Última importación exitosa: ${report.supabase.lastSuccessfulImport ? `${report.supabase.lastSuccessfulImport.id} (${report.supabase.lastSuccessfulImport.status ?? 'sin estado'})` : 'n/a'}`,
    )
  } else {
    console.log(`Supabase bloqueado: ${report.supabase.blockedReason ?? 'n/a'}`)
  }

  if (report.dryRun) {
    console.log(`Dry-run: ${report.status}`)
    console.log(`  Carreras: ${report.dryRun.careers}`)
    console.log(`  Materias: ${report.dryRun.courses}`)
    console.log(`  Secciones: ${report.dryRun.sections}`)
    console.log(`  Reuniones: ${report.dryRun.meetings}`)
    console.log(`  Exámenes: ${report.dryRun.exams}`)
    console.log(`  Advertencias: ${report.dryRun.warnings}`)
    console.log(`  Errores críticos: ${report.dryRun.criticalErrors}`)
    console.log(`  Reporte dry-run: ${report.dryRun.reportPath}`)
  }
}

async function runDryRunImport(
  filePath: string,
  outputPath: string,
  verbose: boolean,
): Promise<ScheduleDryRunSummary> {
  const service = createImportService({
    filePath,
    dryRun: true,
    skipUpload: true,
    allSheets: true,
    verbose,
    output: outputPath,
    force: false,
  })

  const report = await service.run({
    filePath,
    dryRun: true,
    skipUpload: true,
    allSheets: true,
    verbose,
    output: outputPath,
    force: false,
  })

  return {
    reportPath: outputPath,
    careers: report.summary.careers,
    courses: report.summary.courses,
    sections: report.summary.sections,
    meetings: report.summary.meetings,
    exams: report.summary.exams,
    warnings: report.summary.warnings,
    criticalErrors: report.summary.criticalErrors,
    sheetCount: report.metadata.sheetsProcessed.length + report.metadata.sheetsIgnored.length,
  }
}

export async function runScheduleSourceCheck(
  options: ScheduleSourceCheckOptions,
  deps: ScheduleSourceDeps = {},
): Promise<ScheduleSourceReport> {
  loadAdminEnv()
  const fetchImpl = deps.fetchImpl ?? fetch
  const compareImpl = deps.compareWithSupabase ?? compareWithSupabase

  const page = await fetchOfficialPage(options.sourceUrl, fetchImpl)
  const linksFound = extractScheduleLinks(page.html, page.finalUrl)
  const selection = selectBestScheduleLink(linksFound)

  if (!selection.candidate) {
    throw new Error(selection.reason)
  }

  const resolvedTarget = await resolveScheduleTarget(selection.candidate, fetchImpl)
  const downloaded = await downloadScheduleFile(resolvedTarget.candidate, fetchImpl)
  const validated = await validateDownloadedFile(downloaded)
  const checksum = await calculateSha256(validated.filePath)

  const periodId = options.periodId ?? DEFAULT_ACADEMIC_PERIOD_ID
  const supabase = await compareImpl(checksum, periodId)

  const report: ScheduleSourceReport = {
    sourceUrl: options.sourceUrl,
    page,
    linksFound,
    selectedLink: selection.candidate,
    resolvedTarget,
    file: validated,
    checksum,
    supabase,
    dryRun: null,
    status: 'failed',
  }

  if (supabase.alreadyProcessed) {
    report.status = 'already-processed'
    if (options.output) {
      await mkdir(dirname(options.output), { recursive: true })
      await writeFile(options.output, JSON.stringify(report, null, 2), 'utf8')
    }
    printSummary(report)
    return report
  }

  if (options.downloadOnly) {
    report.status = 'download-only'
    if (options.output) {
      await mkdir(dirname(options.output), { recursive: true })
      await writeFile(options.output, JSON.stringify(report, null, 2), 'utf8')
    }
    printSummary(report)
    return report
  }

  const dryRunReportPath = join(tmpdir(), `poliplan-import-dry-run-${Date.now()}.json`)
  const dryRun = await runDryRunImport(validated.filePath, dryRunReportPath, options.verbose)
  report.dryRun = dryRun
  report.status = dryRun.criticalErrors > 0 ? 'dry-run-with-errors' : 'dry-run-ok'

  if (options.output) {
    await mkdir(dirname(options.output), { recursive: true })
    await writeFile(options.output, JSON.stringify(report, null, 2), 'utf8')
  }

  printSummary(report)
  return report
}
