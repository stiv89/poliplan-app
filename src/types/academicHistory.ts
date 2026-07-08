export type CurriculumCourseType = 'required' | 'elective' | 'optional' | 'extension'

export type AttemptStatus = 'passed' | 'failed' | 'in_progress' | 'pending_review'

export type AttemptSource = 'pdf_import' | 'manual' | 'semester_selection'

export type DerivedCourseStatus = 'passed' | 'failed' | 'in_progress' | 'not_taken'

export type MatchConfidence = 'exact' | 'probable' | 'none' | 'duplicate' | 'repeated_attempt'

export interface CurriculumCourse {
  id: string
  curriculumId: string
  code: string
  name: string
  semesterNumber: number
  credits: number | null
  type: CurriculumCourseType
  electiveSlot?: string | null
}

export interface Curriculum {
  id: string
  careerCode: string
  name: string
  totalCredits: number | null
  courses: CurriculumCourse[]
}

export interface AcademicAttempt {
  id: string
  userId?: string | null
  localProfileId: string
  courseId?: string | null
  originalCourseName: string
  normalizedCourseName: string
  matchedCourseId?: string | null
  matchConfidence?: MatchConfidence | null
  electiveSlot?: string | null
  specificElectiveName?: string | null
  semesterNumber?: number | null
  examDate?: string | null
  recordNumber?: string | null
  score?: number | null
  finalGrade?: number | null
  status: AttemptStatus
  source: AttemptSource
  importId?: string | null
  createdAt: string
  updatedAt: string
}

export interface StudentCourseStatus {
  courseId: string
  status: DerivedCourseStatus
  bestGrade?: number | null
  latestAttemptId?: string | null
  attemptsCount: number
}

export interface AcademicImportRecord {
  id: string
  localProfileId: string
  source: 'pdf'
  fileName: string
  rowCount: number
  confirmedAt: string | null
  createdAt: string
}

export interface AcademicProfile {
  id: string
  curriculumId: string
  careerCode: string
  careerName: string
  importedGpa?: number | null
  updatedAt: string
}

export interface TranscriptParseRow {
  rowIndex: number
  originalCourseName: string
  normalizedCourseName: string
  semesterNumber?: number | null
  semesterLabel?: string | null
  examDate?: string | null
  recordNumber?: string | null
  score?: number | null
  finalGrade?: number | null
  status: AttemptStatus
  electiveSlot?: string | null
  specificElectiveName?: string | null
  isExtension?: boolean
  matchedCourseId?: string | null
  matchConfidence: MatchConfidence
  warnings: string[]
  ignored: boolean
}

export interface ProgressSummary {
  careerName: string
  curriculumName: string
  passedCourses: number
  totalCourses: number
  coursePercent: number
  earnedCredits: number
  totalCredits: number
  creditPercent: number
  gpa: number | null
  completedSemesters: number
  totalSemesters: number
  extensionStatus: 'complete' | 'incomplete' | 'not_registered'
}
