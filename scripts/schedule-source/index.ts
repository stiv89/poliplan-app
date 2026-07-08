import { Command } from 'commander'
import { DEFAULT_ACADEMIC_PERIOD_ID, loadAdminEnv } from '../admin/load-env.ts'
import { runScheduleSourceCheck } from './checkScheduleSource'

loadAdminEnv()

function inferDefaultOutputPath(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `./reports/check-schedule-source-${stamp}.json`
}

export function buildCli(): Command {
  const program = new Command()

  program
    .name('check:schedule-source')
    .description('Detecta, descarga y valida el horario oficial de PoliPlan')
    .option(
      '--source-url <url>',
      'URL de la fuente oficial',
      'https://www.pol.una.py/academico/horarios-de-clases-y-examenes/',
    )
    .option('--period-id <uuid>', 'UUID del periodo académico', DEFAULT_ACADEMIC_PERIOD_ID)
    .option('--output <path>', 'Ruta del reporte JSON', inferDefaultOutputPath())
    .option('--dry-run', 'Ejecuta el importador en modo dry-run', false)
    .option('--download-only', 'Solo descarga y valida el archivo', false)
    .option('--verbose', 'Salida detallada', false)
    .action(async (flags) => {
      try {
        await runScheduleSourceCheck({
          sourceUrl: flags.sourceUrl,
          dryRun: Boolean(flags.dryRun),
          downloadOnly: Boolean(flags.downloadOnly),
          output: flags.output,
          verbose: Boolean(flags.verbose),
          periodId: flags.periodId,
        })
      } catch (error) {
        console.error(error instanceof Error ? error.message : error)
        process.exitCode = 1
      }
    })

  return program
}

buildCli().parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
