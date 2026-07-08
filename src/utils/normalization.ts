import type {
  AcademicPeriod,
  Career,
  ClassMeeting,
  Course,
  CourseSection,
  Exam,
  ScheduleVersion,
} from '@/types/academic'
import { resolveSectionShift } from '@/utils/sectionCode'

export function normalizeTime(value: string): string {
  const parts = value.trim().split(':')
  const hours = String(Number(parts[0] ?? 0)).padStart(2, '0')
  const minutes = String(Number(parts[1] ?? 0)).padStart(2, '0')
  return `${hours}:${minutes}:00`
}

export function normalizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function mapDbAcademicPeriod(row: Record<string, unknown>): AcademicPeriod {
  return {
    id: String(row.id),
    name: String(row.name),
    year: Number(row.year),
    term: Number(row.term),
    startsAt: row.starts_at ? String(row.starts_at) : null,
    endsAt: row.ends_at ? String(row.ends_at) : null,
    isActive: Boolean(row.is_active),
  }
}

export function mapDbCareer(row: Record<string, unknown>): Career {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    faculty: normalizeText(row.faculty as string | null),
    campus: normalizeText(row.campus as string | null),
  }
}

export function mapDbCourse(row: Record<string, unknown>): Course {
  return {
    id: String(row.id),
    code: normalizeText(row.code as string | null),
    name: String(row.name),
    careerId: String(row.career_id),
    level: row.level == null ? null : Number(row.level),
    semester: row.semester == null ? null : Number(row.semester),
  }
}

export function mapDbMeeting(row: Record<string, unknown>): ClassMeeting {
  return {
    id: String(row.id),
    sectionId: String(row.section_id),
    dayOfWeek: Number(row.day_of_week),
    startTime: normalizeTime(String(row.start_time)),
    endTime: normalizeTime(String(row.end_time)),
    classroom: normalizeText(row.classroom as string | null),
    specialDates: Array.isArray(row.special_dates)
      ? (row.special_dates as string[])
      : null,
  }
}

export function mapDbExam(row: Record<string, unknown>): Exam {
  return {
    id: String(row.id),
    sectionId: String(row.section_id),
    examType: String(row.exam_type),
    examDate: row.exam_date ? String(row.exam_date) : null,
    startTime: row.start_time ? normalizeTime(String(row.start_time)) : null,
    endTime: row.end_time ? normalizeTime(String(row.end_time)) : null,
    classroom: normalizeText(row.classroom as string | null),
  }
}

export function mapDbSection(
  row: Record<string, unknown>,
  meetings: ClassMeeting[],
  exams: Exam[],
): CourseSection {
  const sectionCode = String(row.section_code)
  const rawShift = normalizeText(row.shift as string | null)

  return {
    id: String(row.id),
    courseId: String(row.course_id),
    academicPeriodId: String(row.academic_period_id),
    sectionCode,
    shift: resolveSectionShift({ sectionCode, shift: rawShift }),
    teacherName: normalizeText(row.teacher_name as string | null),
    teacherEmail: normalizeText(row.teacher_email as string | null),
    teacherId: row.teacher_id ? String(row.teacher_id) : null,
    specificElectiveName: normalizeText(row.specific_elective_name as string | null),
    meetings,
    exams,
  }
}

export function mapDbScheduleVersion(row: Record<string, unknown>): ScheduleVersion {
  return {
    id: String(row.id),
    academicPeriodId: String(row.academic_period_id),
    version: Number(row.version),
    sourceUrl: normalizeText(row.source_url as string | null),
    sourceFileName: normalizeText(row.source_file_name as string | null),
    sourceChecksum: normalizeText(row.source_checksum as string | null),
    sourceModifiedAt: row.source_modified_at
      ? String(row.source_modified_at)
      : null,
    importedAt: String(row.imported_at),
    isActive: Boolean(row.is_active),
    importStatus: String(row.import_status),
    errorMessage: normalizeText(row.error_message as string | null),
  }
}

export function attachMeetingsAndExams(
  sections: Omit<CourseSection, 'meetings' | 'exams'>[],
  meetings: ClassMeeting[],
  exams: Exam[],
): CourseSection[] {
  return sections.map((section) => ({
    ...section,
    meetings: meetings.filter((meeting) => meeting.sectionId === section.id),
    exams: exams.filter((exam) => exam.sectionId === section.id),
  }))
}
