import { Command } from 'commander'
import type { ImportCliOptions } from './types'
import { createImportService, inferDefaultOutputPath } from './services/ImportService'

export function buildCli(): Command {
  const program = new Command()

  program
    .name('import:schedule')
    .description('Importador de horarios institucionales de PoliPlan')
    .argument('<file>', 'Ruta al archivo Excel')
    .option('--dry-run', 'No escribe en Supabase', false)
    .option('--period-id <uuid>', 'UUID del periodo académico')
    .option('--output <path>', 'Ruta del reporte JSON')
    .option('--sheet <name>', 'Procesar una sola hoja')
    .option('--all-sheets', 'Procesar todas las hojas del workbook', false)
    .option('--skip-upload', 'Omitir carga a Supabase', false)
    .option('--verbose', 'Salida detallada', false)
    .option('--force', 'Permitir reimportar checksum existente', false)
    .action(async (file: string, flags) => {
      const options: ImportCliOptions = {
        filePath: file,
        dryRun: Boolean(flags.dryRun),
        periodId: flags.periodId,
        output: flags.output ?? (flags.dryRun ? inferDefaultOutputPath(file) : undefined),
        sheet: flags.sheet,
        allSheets: Boolean(flags.allSheets || !flags.sheet),
        skipUpload: Boolean(flags.skipUpload),
        verbose: Boolean(flags.verbose),
        force: Boolean(flags.force),
      }

      const service = createImportService(options)
      const report = await service.run(options)

      if (report.summary.criticalErrors > 0) {
        process.exitCode = 2
      }
    })

  return program
}
