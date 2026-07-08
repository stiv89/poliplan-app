import { db, SETTINGS_ID } from '@/db/database'
import { DEFAULT_SETTINGS } from '@/db/schema'
import type { ScheduleRepository } from '@/repositories/ScheduleRepository'
import type {
  AcademicPeriod,
  Career,
  Course,
  CourseSection,
  SampleScheduleBundle,
  ScheduleVersion,
} from '@/types/academic'
import type { SelectedSectionRecord } from '@/types/schedule'
import { attachMeetingsAndExams } from '@/utils/normalization'

let sampleCache: SampleScheduleBundle | null = null

async function loadSampleBundle(): Promise<SampleScheduleBundle> {
  if (sampleCache) {
    return sampleCache
  }

  const response = await fetch('/data/sample-schedule.json')
  if (!response.ok) {
    throw new Error('No se pudo cargar sample-schedule.json')
  }

  sampleCache = (await response.json()) as SampleScheduleBundle
  return sampleCache
}

async function ensureSettings() {
  const existing = await db.settings.get(SETTINGS_ID)
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS)
  }
}

export class LocalScheduleRepository implements ScheduleRepository {
  private async hydrateFromSampleIfEmpty(): Promise<void> {
    const count = await db.cachedAcademicPeriods.count()
    if (count > 0) {
      return
    }

    const bundle = await loadSampleBundle()
    await this.saveBundle(bundle)
  }

  async saveBundle(bundle: SampleScheduleBundle): Promise<void> {
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

        await db.cachedAcademicPeriods.bulkPut(bundle.academicPeriods)
        await db.cachedCareers.bulkPut(bundle.careers)
        await db.cachedCourses.bulkPut(bundle.courses)

        const baseSections = bundle.sections.map(
          ({ meetings: _m, exams: _e, ...section }) => section,
        )
        await db.cachedSections.bulkPut(
          attachMeetingsAndExams(
            baseSections,
            bundle.sections.flatMap((section) => section.meetings),
            bundle.sections.flatMap((section) => section.exams),
          ),
        )

        const meetings = bundle.sections.flatMap((section) => section.meetings)
        const exams = bundle.sections.flatMap((section) => section.exams)
        await db.cachedMeetings.bulkPut(meetings)
        await db.cachedExams.bulkPut(exams)

        for (const version of bundle.scheduleVersions) {
          await db.localScheduleVersions.put({
            academicPeriodId: version.academicPeriodId,
            version: version.version,
            downloadedAt: version.importedAt,
            checksum: version.sourceChecksum,
          })
        }
      },
    )
  }

  async getAcademicPeriods(): Promise<AcademicPeriod[]> {
    await ensureSettings()
    await this.hydrateFromSampleIfEmpty()
    return db.cachedAcademicPeriods.orderBy('year').reverse().toArray()
  }

  async getActiveAcademicPeriod(): Promise<AcademicPeriod | null> {
    const settings = await this.getSettings()
    if (settings.selectedAcademicPeriodId) {
      const selected = await db.cachedAcademicPeriods.get(
        settings.selectedAcademicPeriodId,
      )
      if (selected) {
        return selected
      }
    }

    const active = await db.cachedAcademicPeriods.filter((period) => period.isActive).first()
    return active ?? null
  }

  async getCareers(_periodId: string): Promise<Career[]> {
    await this.hydrateFromSampleIfEmpty()
    return db.cachedCareers.orderBy('name').toArray()
  }

  async getCourses(_periodId: string, careerId: string): Promise<Course[]> {
    await this.hydrateFromSampleIfEmpty()
    return db.cachedCourses.where('careerId').equals(careerId).sortBy('name')
  }

  async getCoursesForPeriod(periodId: string): Promise<Course[]> {
    await this.hydrateFromSampleIfEmpty()
    const sections = await db.cachedSections.where('academicPeriodId').equals(periodId).toArray()
    const courseIds = [...new Set(sections.map((section) => section.courseId))]
    const courses = await db.cachedCourses.bulkGet(courseIds)
    return courses.filter((course): course is Course => course != null).sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  }

  async getSections(periodId: string, courseId: string): Promise<CourseSection[]> {
    await this.hydrateFromSampleIfEmpty()
    const sections = await db.cachedSections
      .where('academicPeriodId')
      .equals(periodId)
      .filter((section) => section.courseId === courseId)
      .toArray()

    return Promise.all(sections.map((section) => this.hydrateSection(section)))
  }

  async getAllSections(periodId: string, careerId?: string): Promise<CourseSection[]> {
    await this.hydrateFromSampleIfEmpty()
    let sections = await db.cachedSections
      .where('academicPeriodId')
      .equals(periodId)
      .toArray()

    if (careerId) {
      const courseIds = new Set(
        (await db.cachedCourses.where('careerId').equals(careerId).toArray()).map(
          (course) => course.id,
        ),
      )
      sections = sections.filter((section) => courseIds.has(section.courseId))
    }

    return Promise.all(sections.map((section) => this.hydrateSection(section)))
  }

  async getSectionById(sectionId: string): Promise<CourseSection | null> {
    await this.hydrateFromSampleIfEmpty()
    const section = await db.cachedSections.get(sectionId)
    if (!section) {
      return null
    }
    return this.hydrateSection(section)
  }

  async getActiveScheduleVersion(periodId: string): Promise<ScheduleVersion | null> {
    const local = await db.localScheduleVersions.get(periodId)
    if (!local) {
      return null
    }

    return {
      id: `${periodId}-local`,
      academicPeriodId: periodId,
      version: local.version,
      sourceUrl: null,
      sourceFileName: 'local-cache',
      sourceChecksum: local.checksum,
      sourceModifiedAt: null,
      importedAt: local.downloadedAt,
      isActive: true,
      importStatus: 'cached',
      errorMessage: null,
    }
  }

  async refreshScheduleData(_periodId: string): Promise<void> {
    await this.hydrateFromSampleIfEmpty()
  }

  async getSettings() {
    await ensureSettings()
    return (await db.settings.get(SETTINGS_ID)) ?? DEFAULT_SETTINGS
  }

  async updateSettings(
    patch: Partial<{
      selectedCareerId: string | null
      selectedAcademicPeriodId: string | null
      theme: 'light' | 'dark' | 'system'
    }>,
  ) {
    const current = await this.getSettings()
    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    await db.settings.put(next)
    return next
  }

  async getSelectedSections(periodId: string): Promise<SelectedSectionRecord[]> {
    return db.selectedSections.where('academicPeriodId').equals(periodId).toArray()
  }

  async addSelectedSection(input: {
    sectionId: string
    courseId: string
    academicPeriodId: string
  }): Promise<SelectedSectionRecord> {
    const record: SelectedSectionRecord = {
      id: crypto.randomUUID(),
      sectionId: input.sectionId,
      courseId: input.courseId,
      academicPeriodId: input.academicPeriodId,
      createdAt: new Date().toISOString(),
    }
    await db.selectedSections.put(record)
    return record
  }

  async removeSelectedSection(sectionId: string, periodId: string): Promise<void> {
    const existing = await db.selectedSections
      .where('academicPeriodId')
      .equals(periodId)
      .filter((item) => item.sectionId === sectionId)
      .first()

    if (existing) {
      await db.selectedSections.delete(existing.id)
    }
  }

  async getSelectedSectionEntities(periodId: string): Promise<CourseSection[]> {
    const selected = await this.getSelectedSections(periodId)
    const sections = await Promise.all(
      selected.map((item) => this.getSectionById(item.sectionId)),
    )
    return sections.filter((section): section is CourseSection => section !== null)
  }

  private async hydrateSection(section: CourseSection): Promise<CourseSection> {
    if (section.meetings?.length && section.exams) {
      return section
    }

    const meetings = await db.cachedMeetings.where('sectionId').equals(section.id).toArray()
    const exams = await db.cachedExams.where('sectionId').equals(section.id).toArray()
    return { ...section, meetings, exams }
  }
}

export const localScheduleRepository = new LocalScheduleRepository()
