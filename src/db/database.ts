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
  LocalScheduleVersionRecord,
  SelectedSectionRecord,
  SyncQueueItem,
} from '@/types/schedule'

export class PoliPlanDatabase extends Dexie {
  settings!: Table<AppSettings, string>
  selectedSections!: Table<SelectedSectionRecord, string>
  cachedAcademicPeriods!: Table<AcademicPeriod, string>
  cachedCareers!: Table<Career, string>
  cachedCourses!: Table<Course, string>
  cachedSections!: Table<CourseSection, string>
  cachedMeetings!: Table<ClassMeeting, string>
  cachedExams!: Table<Exam, string>
  localScheduleVersions!: Table<LocalScheduleVersionRecord, string>
  syncQueue!: Table<SyncQueueItem, string>

  constructor() {
    super('PoliPlanDatabase')

    this.version(1).stores({
      settings: 'id',
      selectedSections: 'id, sectionId, courseId, academicPeriodId, createdAt',
      cachedAcademicPeriods: 'id, isActive, year, term',
      cachedCareers: 'id, code',
      cachedCourses: 'id, careerId, code',
      cachedSections: 'id, courseId, academicPeriodId, sectionCode',
      cachedMeetings: 'id, sectionId, dayOfWeek',
      cachedExams: 'id, sectionId, examDate',
      localScheduleVersions: 'academicPeriodId, version',
      syncQueue: 'id, status, createdAt',
    })
  }
}

export const db = new PoliPlanDatabase()

export const SETTINGS_ID = 'app-settings'
