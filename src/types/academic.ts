export interface AcademicPeriod {
  id: string
  name: string
  year: number
  term: number
  startsAt: string | null
  endsAt: string | null
  isActive: boolean
}

export interface Career {
  id: string
  code: string
  name: string
  faculty: string | null
  campus: string | null
}

export interface Course {
  id: string
  code: string | null
  name: string
  careerId: string
  level: number | null
  semester: number | null
}

export interface ClassMeeting {
  id: string
  sectionId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  classroom: string | null
  specialDates: string[] | null
}

export interface Exam {
  id: string
  sectionId: string
  examType: string
  examDate: string | null
  startTime: string | null
  endTime: string | null
  classroom: string | null
}

export interface CourseSection {
  id: string
  courseId: string
  academicPeriodId: string
  sectionCode: string
  shift: string | null
  teacherName: string | null
  teacherEmail: string | null
  meetings: ClassMeeting[]
  exams: Exam[]
}

export interface ScheduleVersion {
  id: string
  academicPeriodId: string
  version: number
  sourceUrl: string | null
  sourceFileName: string | null
  sourceChecksum: string | null
  sourceModifiedAt: string | null
  importedAt: string
  isActive: boolean
  importStatus: string
  errorMessage: string | null
}

export interface UserSchedule {
  id: string
  userId: string
  academicPeriodId: string
  name: string
  sectionIds: string[]
}

export type ScheduleConflictType = 'exact' | 'partial' | 'contained' | 'duplicate'

export interface ScheduleConflict {
  id: string
  firstSectionId: string
  secondSectionId: string
  dayOfWeek: number
  overlapStart: string
  overlapEnd: string
  type: ScheduleConflictType
}

export type SyncStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'updated'
  | 'offline'
  | 'error'

export interface SampleScheduleBundle {
  academicPeriods: AcademicPeriod[]
  careers: Career[]
  courses: Course[]
  sections: CourseSection[]
  scheduleVersions: ScheduleVersion[]
}
