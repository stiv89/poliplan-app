import { db } from '@/db/database'
import { getSupabaseClient } from '@/lib/supabase'
import { chunkValues, fetchAllPages } from '@/lib/supabasePagination'
import {
  LocalScheduleRepository,
  localScheduleRepository,
} from '@/repositories/LocalScheduleRepository'
import { detectChanges, persistChanges } from '@/services/changeDetectionService'
import type { ScheduleRepository } from '@/repositories/ScheduleRepository'
import type {
  AcademicPeriod,
  Career,
  Course,
  CourseSection,
  ScheduleVersion,
} from '@/types/academic'
import {
  mapDbAcademicPeriod,
  mapDbCareer,
  mapDbCourse,
  mapDbExam,
  mapDbMeeting,
  mapDbScheduleVersion,
  mapDbSection,
} from '@/utils/normalization'

export class SupabaseScheduleRepository implements ScheduleRepository {
  private get client() {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error('Supabase no está configurado')
    }
    return supabase
  }

  async getAcademicPeriods(): Promise<AcademicPeriod[]> {
    const { data, error } = await this.client
      .from('academic_periods')
      .select('*')
      .order('year', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => mapDbAcademicPeriod(row))
  }

  async getActiveAcademicPeriod(): Promise<AcademicPeriod | null> {
    const { data, error } = await this.client
      .from('academic_periods')
      .select('*')
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapDbAcademicPeriod(data) : null
  }

  async getCareers(_periodId: string): Promise<Career[]> {
    const { data, error } = await this.client.from('careers').select('*').order('name')
    if (error) {
      throw error
    }
    return (data ?? []).map((row) => mapDbCareer(row))
  }

  async getCourses(_periodId: string, careerId: string): Promise<Course[]> {
    const { data, error } = await this.client
      .from('courses')
      .select('*')
      .eq('career_id', careerId)
      .order('name')

    if (error) {
      throw error
    }

    return (data ?? []).map((row) => mapDbCourse(row))
  }

  async getCoursesForPeriod(periodId: string): Promise<Course[]> {
    return this.fetchAllCourses(periodId)
  }

  async getSections(periodId: string, courseId: string): Promise<CourseSection[]> {
    const sections = await this.fetchSections({ periodId, courseId })
    return sections
  }

  async getAllSections(periodId: string, careerId?: string): Promise<CourseSection[]> {
    return this.fetchSections({ periodId, careerId })
  }

  async getSectionById(sectionId: string): Promise<CourseSection | null> {
    const { data, error } = await this.client
      .from('sections')
      .select('*')
      .eq('id', sectionId)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return null
    }

    const [meetings, exams] = await Promise.all([
      this.fetchMeetings([sectionId]),
      this.fetchExams([sectionId]),
    ])

    return mapDbSection(data, meetings, exams)
  }

  async getActiveScheduleVersion(periodId: string): Promise<ScheduleVersion | null> {
    const { data, error } = await this.client
      .from('schedule_versions')
      .select('*')
      .eq('academic_period_id', periodId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapDbScheduleVersion(data) : null
  }

  async refreshScheduleData(periodId: string): Promise<void> {
    const version = await this.getActiveScheduleVersion(periodId)
    if (!version) {
      throw new Error('No hay versión activa para sincronizar')
    }

    const [periods, careers, courses, sectionsRows, meetingsRows, examsRows] =
      await Promise.all([
        this.getAcademicPeriods(),
        this.getCareers(periodId),
        this.fetchAllCourses(periodId, version.id),
        this.fetchSectionRows(periodId, { versionId: version.id }),
        this.fetchAllMeetings(periodId, version.id),
        this.fetchAllExams(periodId, version.id),
      ])

    const sectionIds = sectionsRows.map((row) => String(row.id))
    const meetings = meetingsRows.filter((meeting) =>
      sectionIds.includes(meeting.sectionId),
    )
    const exams = examsRows.filter((exam) => sectionIds.includes(exam.sectionId))

    const sections = sectionsRows.map((row) =>
      mapDbSection(
        row,
        meetings.filter((meeting) => meeting.sectionId === String(row.id)),
        exams.filter((exam) => exam.sectionId === String(row.id)),
      ),
    )

    const previousSnapshot = {
      periods: await db.cachedAcademicPeriods.toArray(),
      careers: await db.cachedCareers.toArray(),
      courses: await db.cachedCourses.toArray(),
      sections: await db.cachedSections.toArray(),
      meetings: await db.cachedMeetings.toArray(),
      exams: await db.cachedExams.toArray(),
      versions: await db.localScheduleVersions.toArray(),
    }

    try {
      await db.transaction(
        'rw',
        [
          db.cachedAcademicPeriods,
          db.cachedCareers,
          db.cachedCourses,
          db.cachedSections,
          db.cachedMeetings,
          db.cachedExams,
          db.localScheduleVersions,
        ],
        async () => {
          const unrelatedPeriods = previousSnapshot.periods.filter(
            (period) => period.id !== periodId,
          )
          const unrelatedSections = previousSnapshot.sections.filter(
            (section) => section.academicPeriodId !== periodId,
          )
          const unrelatedSectionIds = new Set(unrelatedSections.map((section) => section.id))
          const unrelatedMeetings = previousSnapshot.meetings.filter(
            (meeting) => !unrelatedSectionIds.has(meeting.sectionId),
          )
          const unrelatedExams = previousSnapshot.exams.filter(
            (exam) => !unrelatedSectionIds.has(exam.sectionId),
          )

          await db.cachedAcademicPeriods.clear()
          await db.cachedCareers.clear()
          await db.cachedCourses.clear()
          await db.cachedSections.clear()
          await db.cachedMeetings.clear()
          await db.cachedExams.clear()

          await db.cachedAcademicPeriods.bulkPut(unrelatedPeriods)
          await db.cachedAcademicPeriods.bulkPut(periods)
          await db.cachedCareers.bulkPut(careers)
          await db.cachedCourses.bulkPut(courses)
          await db.cachedSections.bulkPut(unrelatedSections)
          await db.cachedSections.bulkPut(sections)
          await db.cachedMeetings.bulkPut(unrelatedMeetings)
          await db.cachedMeetings.bulkPut(meetings)
          await db.cachedExams.bulkPut(unrelatedExams)
          await db.cachedExams.bulkPut(exams)

          await db.localScheduleVersions.put({
            academicPeriodId: periodId,
            version: version.version,
            downloadedAt: new Date().toISOString(),
            checksum: version.sourceChecksum,
          })
        },
      )

      const previousPeriodSections = previousSnapshot.sections.filter(
        (section) => section.academicPeriodId === periodId,
      )
      const previousVersion = previousSnapshot.versions.find(
        (item) => item.academicPeriodId === periodId,
      )

      const settings = await db.settings.get('app-settings')
      const activeScheduleId = settings?.activeScheduleId
      const selectedSectionIds = activeScheduleId
        ? new Set(
            (
              await db.selectedSections.where('scheduleId').equals(activeScheduleId).toArray()
            ).map((record) => record.sectionId),
          )
        : new Set<string>()

      const coursesMap = new Map(
        [...previousSnapshot.courses, ...courses].map((course) => [course.id, { name: course.name }]),
      )

      const changes = detectChanges({
        previousSections: previousPeriodSections,
        newSections: sections,
        coursesById: coursesMap,
        selectedSectionIds,
        versionFrom: previousVersion?.version ?? 0,
        versionTo: version.version,
      })

      if (changes.length > 0) {
        await persistChanges(changes)
        window.dispatchEvent(new CustomEvent('poliplan:changes-updated'))
      }
    } catch (error) {
      await db.transaction(
        'rw',
        [
          db.cachedAcademicPeriods,
          db.cachedCareers,
          db.cachedCourses,
          db.cachedSections,
          db.cachedMeetings,
          db.cachedExams,
          db.localScheduleVersions,
        ],
        async () => {
          await db.cachedAcademicPeriods.clear()
          await db.cachedCareers.clear()
          await db.cachedCourses.clear()
          await db.cachedSections.clear()
          await db.cachedMeetings.clear()
          await db.cachedExams.clear()
          await db.cachedAcademicPeriods.bulkPut(previousSnapshot.periods)
          await db.cachedCareers.bulkPut(previousSnapshot.careers)
          await db.cachedCourses.bulkPut(previousSnapshot.courses)
          await db.cachedSections.bulkPut(previousSnapshot.sections)
          await db.cachedMeetings.bulkPut(previousSnapshot.meetings)
          await db.cachedExams.bulkPut(previousSnapshot.exams)
          await db.localScheduleVersions.bulkPut(previousSnapshot.versions)
        },
      )
      throw error
    }
  }

  private async fetchSections(input: {
    periodId: string
    courseId?: string
    careerId?: string
  }): Promise<CourseSection[]> {
    const version = await this.getActiveScheduleVersion(input.periodId)
    if (!version) {
      return []
    }

    let sectionRows: Record<string, unknown>[]

    if (input.careerId) {
      const courses = await this.getCourses(input.periodId, input.careerId)
      const courseIds = courses.map((course) => course.id)
      if (courseIds.length === 0) {
        return []
      }
      sectionRows = await this.fetchSectionRows(input.periodId, {
        versionId: version.id,
        courseIds,
      })
    } else {
      sectionRows = await this.fetchSectionRows(input.periodId, {
        courseId: input.courseId,
        versionId: version.id,
      })
    }

    const sectionIds = sectionRows.map((row) => String(row.id))
    const [meetings, exams] = await Promise.all([
      this.fetchMeetings(sectionIds),
      this.fetchExams(sectionIds),
    ])

    return sectionRows.map((row) =>
      mapDbSection(
        row,
        meetings.filter((meeting) => meeting.sectionId === String(row.id)),
        exams.filter((exam) => exam.sectionId === String(row.id)),
      ),
    )
  }

  private async fetchSectionRows(
    periodId: string,
    options: {
      courseId?: string
      courseIds?: string[]
      versionId?: string
    } = {},
  ) {
    const activeVersionId =
      options.versionId ?? (await this.getActiveScheduleVersion(periodId))?.id ?? null

    if (!activeVersionId) {
      return []
    }

    if (options.courseIds && options.courseIds.length > 0) {
      const chunks = chunkValues(options.courseIds)
      const rows = await Promise.all(
        chunks.map((courseIds) =>
          fetchAllPages<Record<string, unknown>>(({ from, to }) =>
            this.client
              .from('sections')
              .select('*')
              .eq('academic_period_id', periodId)
              .eq('schedule_version_id', activeVersionId)
              .in('course_id', courseIds)
              .range(from, to),
          ),
        ),
      )
      return rows.flat()
    }

    return fetchAllPages<Record<string, unknown>>(({ from, to }) => {
      let query = this.client
        .from('sections')
        .select('*')
        .eq('academic_period_id', periodId)
        .eq('schedule_version_id', activeVersionId)
        .range(from, to)

      if (options.courseId) {
        query = query.eq('course_id', options.courseId)
      }

      return query
    })
  }

  private async fetchAllCourses(periodId: string, versionId?: string): Promise<Course[]> {
    const activeVersionId =
      versionId ?? (await this.getActiveScheduleVersion(periodId))?.id ?? null

    if (!activeVersionId) {
      return []
    }

    const sectionRows = await fetchAllPages<{ course_id: string }>(({ from, to }) =>
      this.client
        .from('sections')
        .select('course_id')
        .eq('academic_period_id', periodId)
        .eq('schedule_version_id', activeVersionId)
        .range(from, to),
    )

    const courseIds = [...new Set(sectionRows.map((row) => String(row.course_id)))]
    if (courseIds.length === 0) {
      return []
    }

    const courseRows = await Promise.all(
      chunkValues(courseIds).map((ids) =>
        fetchAllPages<Record<string, unknown>>(({ from, to }) =>
          this.client.from('courses').select('*').in('id', ids).range(from, to),
        ),
      ),
    )

    return courseRows.flat().map((row) => mapDbCourse(row))
  }

  private async fetchMeetings(sectionIds: string[]) {
    if (sectionIds.length === 0) {
      return []
    }

    const rows = await Promise.all(
      chunkValues(sectionIds).map((chunk) =>
        fetchAllPages<Record<string, unknown>>(({ from, to }) =>
          this.client.from('class_meetings').select('*').in('section_id', chunk).range(from, to),
        ),
      ),
    )

    return rows.flat().map((row) => mapDbMeeting(row))
  }

  private async fetchAllMeetings(periodId: string, versionId?: string) {
    const sectionRows = await this.fetchSectionRows(periodId, { versionId })
    return this.fetchMeetings(sectionRows.map((row) => String(row.id)))
  }

  private async fetchExams(sectionIds: string[]) {
    if (sectionIds.length === 0) {
      return []
    }

    const rows = await Promise.all(
      chunkValues(sectionIds).map((chunk) =>
        fetchAllPages<Record<string, unknown>>(({ from, to }) =>
          this.client.from('exams').select('*').in('section_id', chunk).range(from, to),
        ),
      ),
    )

    return rows.flat().map((row) => mapDbExam(row))
  }

  private async fetchAllExams(periodId: string, versionId?: string) {
    const sectionRows = await this.fetchSectionRows(periodId, { versionId })
    return this.fetchExams(sectionRows.map((row) => String(row.id)))
  }
}

export class CompositeScheduleRepository implements ScheduleRepository {
  constructor(
    private remote: SupabaseScheduleRepository,
    private local: LocalScheduleRepository,
  ) {}

  async getAcademicPeriods(): Promise<AcademicPeriod[]> {
    return this.withFallback(() => this.remote.getAcademicPeriods(), () =>
      this.local.getAcademicPeriods(),
    )
  }

  async getActiveAcademicPeriod(): Promise<AcademicPeriod | null> {
    return this.withFallback(() => this.remote.getActiveAcademicPeriod(), () =>
      this.local.getActiveAcademicPeriod(),
    )
  }

  async getCareers(periodId: string): Promise<Career[]> {
    return this.withFallback(() => this.remote.getCareers(periodId), () =>
      this.local.getCareers(periodId),
    )
  }

  async getCourses(periodId: string, careerId: string): Promise<Course[]> {
    return this.withFallback(() => this.remote.getCourses(periodId, careerId), () =>
      this.local.getCourses(periodId, careerId),
    )
  }

  async getCoursesForPeriod(periodId: string): Promise<Course[]> {
    return this.withFallback(() => this.remote.getCoursesForPeriod(periodId), () =>
      this.local.getCoursesForPeriod(periodId),
    )
  }

  async getSections(periodId: string, courseId: string): Promise<CourseSection[]> {
    return this.withFallback(() => this.remote.getSections(periodId, courseId), () =>
      this.local.getSections(periodId, courseId),
    )
  }

  async getAllSections(periodId: string, careerId?: string): Promise<CourseSection[]> {
    return this.withFallback(() => this.remote.getAllSections(periodId, careerId), () =>
      this.local.getAllSections(periodId, careerId),
    )
  }

  async getSectionById(sectionId: string): Promise<CourseSection | null> {
    return this.withFallback(() => this.remote.getSectionById(sectionId), () =>
      this.local.getSectionById(sectionId),
    )
  }

  async getActiveScheduleVersion(periodId: string): Promise<ScheduleVersion | null> {
    return this.withFallback(() => this.remote.getActiveScheduleVersion(periodId), () =>
      this.local.getActiveScheduleVersion(periodId),
    )
  }

  async refreshScheduleData(periodId: string): Promise<void> {
    if (!navigator.onLine || !getSupabaseClient()) {
      await this.local.refreshScheduleData(periodId)
      return
    }

    try {
      await this.remote.refreshScheduleData(periodId)
    } catch {
      await this.local.refreshScheduleData(periodId)
    }
  }

  private async withFallback<T>(
    remoteFn: () => Promise<T>,
    localFn: () => Promise<T>,
  ): Promise<T> {
    if (!navigator.onLine || !getSupabaseClient()) {
      return localFn()
    }

    try {
      return await remoteFn()
    } catch {
      return localFn()
    }
  }
}

const supabaseRepository = new SupabaseScheduleRepository()

export function createScheduleRepository(): ScheduleRepository {
  if (import.meta.env.VITE_USE_SAMPLE_DATA === 'true') {
    return localScheduleRepository
  }

  if (!getSupabaseClient()) {
    return localScheduleRepository
  }

  return new CompositeScheduleRepository(supabaseRepository, localScheduleRepository)
}

export const scheduleRepository = createScheduleRepository()

export { localScheduleRepository }
