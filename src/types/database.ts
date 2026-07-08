import type {
  AcademicPeriod,
  Career,
  ClassMeeting,
  Course,
  CourseSection,
  Exam,
} from './academic'
import type {
  AppSettings,
  LocalScheduleVersionRecord,
  SelectedSectionRecord,
  SyncQueueItem,
} from './schedule'

export interface PoliPlanTables {
  settings: AppSettings
  selectedSections: SelectedSectionRecord
  cachedAcademicPeriods: AcademicPeriod
  cachedCareers: Career
  cachedCourses: Course
  cachedSections: CourseSection
  cachedMeetings: ClassMeeting
  cachedExams: Exam
  localScheduleVersions: LocalScheduleVersionRecord
  syncQueue: SyncQueueItem
}

export type TableName = keyof PoliPlanTables
