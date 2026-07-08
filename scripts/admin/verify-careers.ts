import { createClient } from '@supabase/supabase-js'
import { loadAdminEnv } from './load-env.ts'
import { chunkValues, fetchAllPages } from '../../src/lib/supabasePagination.ts'

const PERIOD_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'

async function main() {
  loadAdminEnv()
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltan credenciales admin')
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: version, error: versionError } = await client
    .from('schedule_versions')
    .select('id')
    .eq('academic_period_id', PERIOD_ID)
    .eq('is_active', true)
    .maybeSingle()

  if (versionError || !version) {
    throw new Error('No hay versión activa del horario')
  }

  const { data: careers, error: careersError } = await client
    .from('careers')
    .select('id,code,name')
    .order('code')

  if (careersError) {
    throw careersError
  }

  const allCourses = await fetchAllPages<{ id: string; career_id: string; name: string }>(
    ({ from, to }) =>
      client.from('courses').select('id,career_id,name').order('name').range(from, to),
  )

  const allSections = await fetchAllPages<{ id: string; course_id: string }>(({ from, to }) =>
    client
      .from('sections')
      .select('id,course_id')
      .eq('academic_period_id', PERIOD_ID)
      .eq('schedule_version_id', version.id)
      .range(from, to),
  )

  const coursesByCareer = new Map<string, typeof allCourses>()
  for (const course of allCourses) {
    const list = coursesByCareer.get(course.career_id) ?? []
    list.push(course)
    coursesByCareer.set(course.career_id, list)
  }

  const sectionsByCourse = new Map<string, number>()
  for (const section of allSections) {
    sectionsByCourse.set(section.course_id, (sectionsByCourse.get(section.course_id) ?? 0) + 1)
  }

  const report = (careers ?? []).map((career) => {
    const courses = coursesByCareer.get(career.id) ?? []
    const sections = courses.reduce(
      (sum, course) => sum + (sectionsByCourse.get(course.id) ?? 0),
      0,
    )
    const coursesWithoutSections = courses.filter(
      (course) => (sectionsByCourse.get(course.id) ?? 0) === 0,
    )

    return {
      code: career.code,
      name: career.name,
      courses: courses.length,
      sections,
      ok: courses.length > 0 && sections > 0,
      coursesWithoutSections: coursesWithoutSections.length,
      sampleCourses: courses.slice(0, 3).map((c) => c.name),
    }
  })

  const orphanCourses = allCourses.filter(
    (course) => !(careers ?? []).some((career) => career.id === course.career_id),
  )

  const orphanSections = allSections.filter(
    (section) => !allCourses.some((course) => course.id === section.course_id),
  )

  const duplicateCodes = Object.entries(
    (careers ?? []).reduce<Record<string, number>>((acc, career) => {
      acc[career.code] = (acc[career.code] ?? 0) + 1
      return acc
    }, {}),
  )
    .filter(([, count]) => count > 1)
    .map(([code]) => code)

  console.log(
    JSON.stringify(
      {
        periodId: PERIOD_ID,
        versionId: version.id,
        totals: {
          careers: careers?.length ?? 0,
          courses: allCourses.length,
          sections: allSections.length,
        },
        duplicateCareerCodes: duplicateCodes,
        orphanCourses: orphanCourses.length,
        orphanSections: orphanSections.length,
        careers: report,
        issues: report
          .filter((item) => !item.ok)
          .map((item) => `${item.code}: ${item.courses} materias, ${item.sections} secciones`),
      },
      null,
      2,
    ),
  )

  // Simula fetch por carrera como la app (paginado + filtro course_id)
  const fetchChecks = await Promise.all(
    (careers ?? []).map(async (career) => {
      const courseIds = (coursesByCareer.get(career.id) ?? []).map((course) => course.id)
      if (courseIds.length === 0) {
        return { code: career.code, fetchedSections: 0, expectedSections: 0, ok: true }
      }

      const chunks = chunkValues(courseIds)
      const fetched = (
        await Promise.all(
          chunks.map((ids) =>
            fetchAllPages<{ id: string }>(({ from, to }) =>
              client
                .from('sections')
                .select('id')
                .eq('academic_period_id', PERIOD_ID)
                .eq('schedule_version_id', version.id)
                .in('course_id', ids)
                .range(from, to),
            ),
          ),
        )
      ).flat()

      const expected = courseIds.reduce(
        (sum, id) => sum + (sectionsByCourse.get(id) ?? 0),
        0,
      )

      return {
        code: career.code,
        fetchedSections: fetched.length,
        expectedSections: expected,
        ok: fetched.length === expected,
      }
    }),
  )

  const fetchIssues = fetchChecks.filter((item) => !item.ok)
  console.log('\nFetch por carrera (como la app):')
  console.log(JSON.stringify({ fetchChecks, fetchIssues }, null, 2))

  if (report.some((item) => !item.ok) || fetchIssues.length > 0 || orphanCourses.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
