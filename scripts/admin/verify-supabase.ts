import { loadAdminEnv, DEFAULT_ACADEMIC_PERIOD_ID } from './load-env.ts'

loadAdminEnv()

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Faltan SUPABASE_URL y clave de acceso')
  process.exit(1)
}

const periodId = process.argv[2] ?? DEFAULT_ACADEMIC_PERIOD_ID

async function count(table: string, query = ''): Promise<number> {
  const response = await fetch(`${url}/rest/v1/${table}?select=id${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
    },
  })

  const contentRange = response.headers.get('content-range')
  const total = contentRange?.split('/')?.[1]
  return total ? Number(total) : 0
}

async function main() {
  const versionResponse = await fetch(
    `${url}/rest/v1/schedule_versions?academic_period_id=eq.${periodId}&is_active=eq.true&select=*`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  const activeVersions = await versionResponse.json()

  const versionId = activeVersions[0]?.id
  const sectionsQuery = versionId
    ? `&academic_period_id=eq.${periodId}&schedule_version_id=eq.${versionId}`
    : `&academic_period_id=eq.${periodId}`

  const [sections, meetings, exams, careers, courses] = await Promise.all([
    count('sections', sectionsQuery),
    count('class_meetings'),
    count('exams'),
    count('careers'),
    count('courses'),
  ])

  console.log(
    JSON.stringify(
      {
        periodId,
        activeVersions,
        counts: { careers, courses, sections, meetings, exams },
      },
      null,
      2,
    ),
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
