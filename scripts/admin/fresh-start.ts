import { resolve } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { loadAdminEnv, DEFAULT_ACADEMIC_PERIOD_ID } from './load-env.ts'
import { createImportService } from '../import-schedule/services/ImportService'
import { stableUuid } from '../import-schedule/sources/LocalFileSource'
import type { ImportCliOptions } from '../import-schedule/types'

const CAREERS: Array<{ code: string; name: string; campus?: string | null }> = [
  { code: 'IAE', name: 'Ingeniería Aeronáutica' },
  { code: 'ICM', name: 'Ingeniería Civil Mención Construcciones' },
  { code: 'IEK', name: 'Ingeniería Eléctrica Mención Electrónica' },
  { code: 'IEL', name: 'Ingeniería Eléctrica Mención Electricidad' },
  { code: 'IEN', name: 'Ingeniería Electrónica' },
  { code: 'IIN', name: 'Ingeniería Informática' },
  { code: 'IMK', name: 'Ingeniería Mecánica' },
  { code: 'ISP', name: 'Ingeniería en Sistemas de Producción' },
  { code: 'LCA', name: 'Licenciatura en Ciencias Ambientales' },
  { code: 'LCI', name: 'Licenciatura en Comercio Internacional' },
  { code: 'LEL', name: 'Licenciatura en Electrónica' },
  { code: 'LGH', name: 'Licenciatura en Gestión Hotelera' },
  { code: 'TSE', name: 'Tecnicatura en Sistemas Eléctricos' },
]

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

async function deleteAll(client: SupabaseClient, table: string): Promise<void> {
  const { error } = await client.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) {
    throw new Error(`No se pudo limpiar ${table}: ${error.message}`)
  }
}

export async function resetAcademicData(client = getAdminClient()): Promise<void> {
  console.log('Limpiando datos académicos…')

  await client.from('profiles').update({ career_id: null }).not('career_id', 'is', null)

  for (const table of [
    'teacher_review_reports',
    'teacher_reviews',
    'user_schedule_sections',
    'user_schedules',
    'exams',
    'class_meetings',
    'sections',
    'schedule_versions',
    'schedule_imports',
    'courses',
    'teachers',
    'careers',
    'academic_periods',
  ]) {
    await deleteAll(client, table)
    console.log(`  ✓ ${table}`)
  }

  const { error: periodError } = await client.from('academic_periods').insert({
    id: DEFAULT_ACADEMIC_PERIOD_ID,
    name: 'Primer Periodo 2026',
    year: 2026,
    term: 1,
    starts_at: '2026-03-01',
    ends_at: '2026-07-31',
    is_active: true,
  })

  if (periodError) {
    throw new Error(`No se pudo crear el periodo: ${periodError.message}`)
  }

  const { error: careersError } = await client.from('careers').upsert(
    CAREERS.map((career) => ({
      id: stableUuid('career', career.code),
      code: career.code,
      name: career.name,
      faculty: 'Facultad Politécnica',
      campus: career.campus ?? 'San Lorenzo',
    })),
    { onConflict: 'code' },
  )

  if (careersError) {
    throw new Error(`No se pudieron crear las carreras: ${careersError.message}`)
  }

  console.log(`  ✓ academic_periods + ${CAREERS.length} carreras`)
}

async function main() {
  loadAdminEnv()

  const cliArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  const excelPath =
    cliArgs[0] ??
    resolve(
      process.cwd(),
      'excel/Horario de clases y examenes Primer Periodo 2026 version web 05062026.xlsx',
    )

  const dryRun = process.argv.includes('--dry-run')
  const skipReset = process.argv.includes('--skip-reset')

  const importOptions: ImportCliOptions = {
    filePath: excelPath,
    dryRun,
    periodId: DEFAULT_ACADEMIC_PERIOD_ID,
    allSheets: true,
    skipUpload: false,
    verbose: true,
    force: true,
  }

  if (!skipReset && !dryRun) {
    await resetAcademicData()
    console.log('')
  }

  console.log(dryRun ? 'Simulando importación…' : 'Importando horarios…')
  const service = createImportService(importOptions)
  const report = await service.run(importOptions)

  if (report.summary.criticalErrors > 0) {
    process.exitCode = 2
    return
  }

  console.log('')
  console.log('Listo.')
  console.log(
    `  Carreras: ${report.summary.careers} · Materias: ${report.summary.courses} · Secciones: ${report.summary.sections}`,
  )
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
