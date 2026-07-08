/**
 * Agrega periodos 2025 y importa el Excel del Segundo Periodo Académico 2025.
 * No borra datos del periodo 2026 existente.
 *
 * Uso: npm run admin:import-2025-periods
 */
import { resolve } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  loadAdminEnv,
  ACADEMIC_PERIODS,
  FIRST_PERIOD_2025_ID,
  SECOND_PERIOD_2025_ID,
} from './load-env.ts'
import { createImportService } from '../import-schedule/services/ImportService'
import type { ImportCliOptions } from '../import-schedule/types'

function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Configurá SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.admin (ver .env.admin.example)',
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function upsertHistoricalPeriods(client: SupabaseClient): Promise<void> {
  const historical = ACADEMIC_PERIODS.filter((period) => period.year === 2025)

  const { error } = await client.from('academic_periods').upsert(
    historical.map((period) => ({
      id: period.id,
      name: period.name,
      year: period.year,
      term: period.term,
      starts_at: period.starts_at,
      ends_at: period.ends_at,
      is_active: period.is_active,
    })),
    { onConflict: 'id' },
  )

  if (error) {
    throw new Error(`No se pudieron crear los periodos 2025: ${error.message}`)
  }

  for (const period of historical) {
    console.log(`  ✓ ${period.name}`)
  }
}

async function importSecondPeriod2025(dryRun: boolean): Promise<void> {
  const excelPath = resolve(
    process.cwd(),
    'excel/Horario de clases y examenes .Segundo Periodo Academico version web26112025.xlsx',
  )

  const importOptions: ImportCliOptions = {
    filePath: excelPath,
    dryRun,
    periodId: SECOND_PERIOD_2025_ID,
    allSheets: true,
    skipUpload: false,
    verbose: true,
    force: true,
  }

  console.log(`\nImportando Segundo Periodo 2025 desde:\n  ${excelPath}\n`)

  const service = createImportService(importOptions)
  const report = await service.run(importOptions)

  if (report.summary.criticalErrors > 0) {
    throw new Error('Importación abortada por errores críticos')
  }

  console.log('\nResumen importación II/2025:')
  console.log(
    `  Carreras: ${report.summary.careers} · Materias: ${report.summary.courses} · Secciones: ${report.summary.sections}`,
  )
}

async function main() {
  loadAdminEnv()

  const dryRun = process.argv.includes('--dry-run')
  const skipImport = process.argv.includes('--periods-only')

  const client = getAdminClient()

  console.log('Registrando periodos académicos 2025…')
  await upsertHistoricalPeriods(client)

  console.log(
    `\nNota: Primer Periodo 2025 (${FIRST_PERIOD_2025_ID}) queda disponible en el selector.`,
  )
  console.log('      Aún no hay Excel de ese periodo en el repo para importar materias.\n')

  if (!skipImport) {
    await importSecondPeriod2025(dryRun)
  }

  console.log('\nListo. Recargá la app y elegí el periodo en el header.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
