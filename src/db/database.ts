import Dexie, { type Table } from 'dexie'
import type {
  AcademicPeriod,
  Career,
  ClassMeeting,
  Course,
  CourseSection,
  Exam,
} from '@/types/academic'
import type {
  AppSettings,
  DetectedChangeRecord,
  LocalScheduleVersionRecord,
  SavedScheduleRecord,
  SeenChangeRecord,
  SelectedSectionRecord,
  SyncQueueItem,
} from '@/types/schedule'
import type {
  AcademicAttempt,
  AcademicImportRecord,
  AcademicProfile,
  Curriculum,
} from '@/types/academicHistory'

export class PoliPlanDatabase extends Dexie {
  settings!: Table<AppSettings, string>
  savedSchedules!: Table<SavedScheduleRecord, string>
  selectedSections!: Table<SelectedSectionRecord, string>
  cachedAcademicPeriods!: Table<AcademicPeriod, string>
  cachedCareers!: Table<Career, string>
  cachedCourses!: Table<Course, string>
  cachedSections!: Table<CourseSection, string>
  cachedMeetings!: Table<ClassMeeting, string>
  cachedExams!: Table<Exam, string>
  localScheduleVersions!: Table<LocalScheduleVersionRecord, string>
  syncQueue!: Table<SyncQueueItem, string>
  detectedChanges!: Table<DetectedChangeRecord, string>
  seenChanges!: Table<SeenChangeRecord, string>
  academicProfiles!: Table<AcademicProfile, string>
  academicAttempts!: Table<AcademicAttempt, string>
  academicImports!: Table<AcademicImportRecord, string>
  curricula!: Table<Curriculum, string>

  constructor() {
    super('PoliPlanDatabase')

    const v1Stores = {
      settings: 'id',
      selectedSections: 'id, sectionId, courseId, academicPeriodId, createdAt',
      cachedAcademicPeriods: 'id, isActive, year, term',
      cachedCareers: 'id, code, name',
      cachedCourses: 'id, careerId, code, name',
      cachedSections: 'id, courseId, academicPeriodId, sectionCode',
      cachedMeetings: 'id, sectionId, dayOfWeek',
      cachedExams: 'id, sectionId, examDate',
      localScheduleVersions: 'academicPeriodId, version',
      syncQueue: 'id, status, createdAt',
    }

    this.version(1).stores(v1Stores)
    this.version(2).stores(v1Stores)

    // v3 — agrega tablas para detección de cambios entre versiones
    this.version(3).stores({
      ...v1Stores,
      detectedChanges: 'id, sectionId, courseId, severity, seen, detectedAt, versionTo',
      seenChanges: 'id, seenAt',
    })

    const v4Stores = {
      ...v1Stores,
      savedSchedules: 'id, academicPeriodId, selectedCareerId, deletedAt, updatedAt',
      selectedSections: 'id, scheduleId, sectionId, courseId, academicPeriodId, createdAt',
      detectedChanges: 'id, sectionId, courseId, severity, seen, detectedAt, versionTo',
      seenChanges: 'id, seenAt',
    }

    this.version(4).stores(v4Stores).upgrade(async (transaction) => {
      const settingsTable = transaction.table('settings')
      const schedulesTable = transaction.table('savedSchedules')
      const sectionsTable = transaction.table('selectedSections')
      const periodsTable = transaction.table('cachedAcademicPeriods')

      const settings = (await settingsTable.get('app-settings')) as AppSettings | undefined
      const selectedSections = (await sectionsTable.toArray()) as Array<
        SelectedSectionRecord & { scheduleId?: string }
      >
      const periodIdsFromSections = new Set(
        selectedSections.map((section) => section.academicPeriodId),
      )

      const activePeriod =
        (settings?.selectedAcademicPeriodId
          ? await periodsTable.get(settings.selectedAcademicPeriodId)
          : null) ??
        (await periodsTable.filter((period: AcademicPeriod) => period.isActive).first())

      if (activePeriod) {
        periodIdsFromSections.add(activePeriod.id)
      }

      const scheduleByPeriod = new Map<string, string>()
      const now = new Date().toISOString()

      for (const periodId of periodIdsFromSections) {
        const scheduleId = crypto.randomUUID()
        await schedulesTable.add({
          id: scheduleId,
          name: 'Mi horario',
          academicPeriodId: periodId,
          selectedCareerId:
            periodId === activePeriod?.id ? (settings?.selectedCareerId ?? null) : null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })
        scheduleByPeriod.set(periodId, scheduleId)
      }

      for (const section of selectedSections) {
        const scheduleId = scheduleByPeriod.get(section.academicPeriodId)
        if (!scheduleId) continue
        await sectionsTable.update(section.id, { scheduleId })
      }

      if (settings && scheduleByPeriod.size > 0) {
        const preferredPeriodId = settings.selectedAcademicPeriodId ?? activePeriod?.id ?? null
        const activeScheduleId =
          (preferredPeriodId ? scheduleByPeriod.get(preferredPeriodId) : null) ??
          [...scheduleByPeriod.values()][0]

        await settingsTable.update('app-settings', {
          activeScheduleId,
        })
      }
    })

    this.version(5).stores({
      ...v4Stores,
      academicProfiles: 'id, curriculumId, careerCode, updatedAt',
      academicAttempts:
        'id, localProfileId, matchedCourseId, courseId, status, source, importId, examDate, createdAt',
      academicImports: 'id, localProfileId, createdAt',
      curricula: 'id, careerCode',
    })
  }
}

export const db = new PoliPlanDatabase()

export const SETTINGS_ID = 'app-settings'
