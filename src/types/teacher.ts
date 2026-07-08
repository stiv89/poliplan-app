export interface Teacher {
  id: string
  name: string
  email: string | null
}

export interface TeacherSectionSummary {
  sectionId: string
  sectionCode: string
  courseId: string
  courseName: string
  courseCode: string | null
  academicPeriodId: string
}

export interface TeacherReview {
  id: string
  teacherId: string
  courseId: string | null
  academicPeriodId: string | null
  body: string
  rating: number
  createdAt: string
}

export interface TeacherProfile {
  teacher: Teacher
  sections: TeacherSectionSummary[]
  reviews: TeacherReview[]
  averageRating: number | null
  reviewCount: number
}

export interface OpenTeacherProfileInput {
  teacherId?: string | null
  teacherName?: string | null
  teacherEmail?: string | null
  courseId?: string | null
  academicPeriodId?: string | null
}

export type ReviewSort = 'recent' | 'helpful'

export const REVIEW_REPORT_REASONS = [
  'Spam o publicidad',
  'Lenguaje ofensivo',
  'Información falsa',
  'No habla del docente',
  'Otro',
] as const

export type ReviewReportReason = (typeof REVIEW_REPORT_REASONS)[number]
