import type {
  AcademicPeriod,
  Career,
  Course,
  CourseSection,
  ScheduleVersion,
} from '@/types/academic'

export interface ScheduleRepository {
  getAcademicPeriods(): Promise<AcademicPeriod[]>
  getActiveAcademicPeriod(): Promise<AcademicPeriod | null>
  getCareers(periodId: string): Promise<Career[]>
  getCourses(periodId: string, careerId: string): Promise<Course[]>
  getCoursesForPeriod(periodId: string): Promise<Course[]>
  getSections(periodId: string, courseId: string): Promise<CourseSection[]>
  getAllSections(periodId: string, careerId?: string): Promise<CourseSection[]>
  getSectionById(sectionId: string): Promise<CourseSection | null>
  getActiveScheduleVersion(periodId: string): Promise<ScheduleVersion | null>
  refreshScheduleData(periodId: string): Promise<void>
}
