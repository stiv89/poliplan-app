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
import type { SelectedSectionRecord, SavedScheduleRecord } from '@/types/schedule'
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
    const stored = await db.settings.get(SETTINGS_ID)
    return { ...DEFAULT_SETTINGS, ...stored }
  }

  async updateSettings(
    patch: Partial<{
      selectedCareerId: string | null
      selectedAcademicPeriodId: string | null
      activeScheduleId: string | null
      theme: 'light' | 'dark' | 'system'
      autoSyncEnabled: boolean
      syncOnOpen: boolean
      showChangeAlerts: boolean
      syncPromptDismissedAt: string | null
      notificationPromptDismissedAt: string | null
      lastUserScheduleSyncAt: string | null
      remoteScheduleByLocalId: Record<string, string>
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

  async getSavedSchedules(options?: {
    academicPeriodId?: string
    includeDeleted?: boolean
  }): Promise<SavedScheduleRecord[]> {
    let schedules = await db.savedSchedules.orderBy('updatedAt').reverse().toArray()

    if (options?.academicPeriodId) {
      schedules = schedules.filter(
        (schedule) => schedule.academicPeriodId === options.academicPeriodId,
      )
    }

    if (!options?.includeDeleted) {
      schedules = schedules.filter((schedule) => schedule.deletedAt == null)
    }

    return schedules
  }

  async getSavedScheduleById(scheduleId: string): Promise<SavedScheduleRecord | null> {
    return (await db.savedSchedules.get(scheduleId)) ?? null
  }

  async ensureDefaultSchedule(
    periodId: string,
    careerId: string | null = null,
  ): Promise<SavedScheduleRecord> {
    const existing = await db.savedSchedules
      .where('academicPeriodId')
      .equals(periodId)
      .filter((schedule) => schedule.deletedAt == null)
      .first()

    if (existing) {
      return existing
    }

    const now = new Date().toISOString()
    const schedule: SavedScheduleRecord = {
      id: crypto.randomUUID(),
      name: 'Mi horario',
      academicPeriodId: periodId,
      selectedCareerId: careerId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }
    await db.savedSchedules.put(schedule)
    return schedule
  }

  async resolveActiveSchedule(
    periodId: string,
    preferredScheduleId: string | null,
    careerId: string | null,
  ): Promise<SavedScheduleRecord> {
    if (preferredScheduleId) {
      const preferred = await db.savedSchedules.get(preferredScheduleId)
      if (preferred && preferred.deletedAt == null && preferred.academicPeriodId === periodId) {
        return preferred
      }
    }

    const active = await db.savedSchedules
      .where('academicPeriodId')
      .equals(periodId)
      .filter((schedule) => schedule.deletedAt == null)
      .sortBy('updatedAt')

    if (active.length > 0) {
      return active[active.length - 1]!
    }

    return this.ensureDefaultSchedule(periodId, careerId)
  }

  async createSavedSchedule(input: {
    name: string
    academicPeriodId: string
    selectedCareerId?: string | null
    copyFromScheduleId?: string | null
  }): Promise<SavedScheduleRecord> {
    const now = new Date().toISOString()
    const schedule: SavedScheduleRecord = {
      id: crypto.randomUUID(),
      name: input.name.trim() || 'Nuevo horario',
      academicPeriodId: input.academicPeriodId,
      selectedCareerId: input.selectedCareerId ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }

    await db.transaction('rw', db.savedSchedules, db.selectedSections, async () => {
      await db.savedSchedules.put(schedule)

      if (input.copyFromScheduleId) {
        const sourceSections = await db.selectedSections
          .where('scheduleId')
          .equals(input.copyFromScheduleId)
          .toArray()

        if (sourceSections.length > 0) {
          await db.selectedSections.bulkPut(
            sourceSections.map((section) => ({
              id: crypto.randomUUID(),
              scheduleId: schedule.id,
              sectionId: section.sectionId,
              courseId: section.courseId,
              academicPeriodId: section.academicPeriodId,
              createdAt: now,
            })),
          )
        }
      }
    })

    return schedule
  }

  async renameSavedSchedule(scheduleId: string, name: string): Promise<SavedScheduleRecord> {
    const schedule = await db.savedSchedules.get(scheduleId)
    if (!schedule || schedule.deletedAt) {
      throw new Error('Horario no encontrado')
    }

    const next = {
      ...schedule,
      name: name.trim() || schedule.name,
      updatedAt: new Date().toISOString(),
    }
    await db.savedSchedules.put(next)
    return next
  }

  async touchSavedSchedule(scheduleId: string): Promise<void> {
    const schedule = await db.savedSchedules.get(scheduleId)
    if (!schedule || schedule.deletedAt) return
    await db.savedSchedules.put({
      ...schedule,
      updatedAt: new Date().toISOString(),
    })
  }

  async setSavedScheduleCareer(
    scheduleId: string,
    careerId: string | null,
  ): Promise<SavedScheduleRecord> {
    const schedule = await db.savedSchedules.get(scheduleId)
    if (!schedule || schedule.deletedAt) {
      throw new Error('Horario no encontrado')
    }

    const next = {
      ...schedule,
      selectedCareerId: careerId,
      updatedAt: new Date().toISOString(),
    }
    await db.savedSchedules.put(next)
    return next
  }

  async setSavedScheduleAcademicPeriod(
    scheduleId: string,
    academicPeriodId: string,
  ): Promise<SavedScheduleRecord> {
    const schedule = await db.savedSchedules.get(scheduleId)
    if (!schedule || schedule.deletedAt) {
      throw new Error('Horario no encontrado')
    }

    const next = {
      ...schedule,
      academicPeriodId,
      updatedAt: new Date().toISOString(),
    }
    await db.savedSchedules.put(next)
    return next
  }

  async softDeleteSavedSchedule(scheduleId: string): Promise<SavedScheduleRecord> {
    const schedule = await db.savedSchedules.get(scheduleId)
    if (!schedule || schedule.deletedAt) {
      throw new Error('Horario no encontrado')
    }

    const next = {
      ...schedule,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await db.savedSchedules.put(next)
    return next
  }

  async restoreSavedSchedule(scheduleId: string): Promise<SavedScheduleRecord> {
    const schedule = await db.savedSchedules.get(scheduleId)
    if (!schedule) {
      throw new Error('Horario no encontrado')
    }

    const next = {
      ...schedule,
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    }
    await db.savedSchedules.put(next)
    return next
  }

  async permanentlyDeleteSavedSchedule(scheduleId: string): Promise<void> {
    await db.transaction('rw', db.savedSchedules, db.selectedSections, async () => {
      await db.selectedSections.where('scheduleId').equals(scheduleId).delete()
      await db.savedSchedules.delete(scheduleId)
    })
  }

  async getSelectedSections(scheduleId: string): Promise<SelectedSectionRecord[]> {
    return db.selectedSections.where('scheduleId').equals(scheduleId).toArray()
  }

  async addSelectedSection(input: {
    scheduleId: string
    sectionId: string
    courseId: string
    academicPeriodId: string
  }): Promise<SelectedSectionRecord> {
    const record: SelectedSectionRecord = {
      id: crypto.randomUUID(),
      scheduleId: input.scheduleId,
      sectionId: input.sectionId,
      courseId: input.courseId,
      academicPeriodId: input.academicPeriodId,
      createdAt: new Date().toISOString(),
    }
    await db.selectedSections.put(record)
    await this.touchSavedSchedule(input.scheduleId)
    return record
  }

  async removeSelectedSection(
    sectionId: string,
    scheduleId: string,
  ): Promise<void> {
    const existing = await db.selectedSections
      .where('scheduleId')
      .equals(scheduleId)
      .filter((item) => item.sectionId === sectionId)
      .first()

    if (existing) {
      await db.selectedSections.delete(existing.id)
      await this.touchSavedSchedule(scheduleId)
    }
  }

  async clearSelectedSections(scheduleId: string): Promise<void> {
    await db.selectedSections.where('scheduleId').equals(scheduleId).delete()
    await this.touchSavedSchedule(scheduleId)
  }

  async getSelectedSectionEntities(scheduleId: string): Promise<CourseSection[]> {
    const selected = await this.getSelectedSections(scheduleId)
    const sections = await Promise.all(
      selected.map((item) => this.getSectionById(item.sectionId)),
    )
    return sections.filter((section): section is CourseSection => section !== null)
  }

  /** @deprecated use schedule-scoped getters */
  async getSelectedSectionsByPeriod(periodId: string): Promise<SelectedSectionRecord[]> {
    return db.selectedSections.where('academicPeriodId').equals(periodId).toArray()
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
