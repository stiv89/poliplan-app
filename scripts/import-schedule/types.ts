import type { SheetKind } from '../config'

export interface RawValue {
  rawValue: string
  normalizedValue: string
}

export interface ParsedWorkbookSource {
  filePath: string
  fileName: string
  sizeBytes: number
  checksum: string
  modifiedAt: string | null
}

export interface HeaderMap {
  format: 'standard' | 'villarrica'
  headerRows: number[]
  dataStartRow: number
  columns: {
    item: number
    department: number
    courseName: number
    level: number
    semesterGroup: number
    careerCode: number
    emphasis: number
    plan: number
    shift: number
    sectionCode: number
    teacherTitle: number
    teacherLastName: number
    teacherFirstName: number
    teacherEmail: number
  }
  weekdays: WeekdayColumnGroup[]
  exams: ExamColumnGroup[]
  specialSaturdayDatesCol?: number
}

export interface WeekdayColumnGroup {
  dayOfWeek: number
  label: string
  scheduleCol: number
  classroomCol?: number
}

export interface ExamColumnGroup {
  examType: string
  label: string
  dateCol?: number
  timeCol?: number
  classroomCol?: number
  boardMemberCols?: number[]
}

export interface ParsedSheetRow {
  sheetName: string
  sheetKind: SheetKind
  rowNumber: number
  careerCode: string
  department: RawValue
  courseName: RawValue
  level: RawValue
  semesterGroup: RawValue
  careerSigla: RawValue
  shift: RawValue
  sectionCode: RawValue
  teacherName: RawValue
  teacherEmail: RawValue
  weekdayCells: Array<{
    dayOfWeek: number
    label: string
    schedule: RawValue
    classroom: RawValue
  }>
  examCells: Array<{
    examType: string
    label: string
    date: RawValue
    time: RawValue
    classroom: RawValue
    boardMembers: RawValue[]
  }>
  specialSaturdayDates?: RawValue
}

export interface NormalizedCareer {
  id: string
  code: string
  name: string
  faculty: string | null
  campus: string | null
  sourceSheet: string
}

export interface NormalizedCourse {
  id: string
  code: string | null
  name: string
  careerId: string
  level: number | null
  semester: number | null
  naturalKey: string
}

export interface NormalizedSection {
  id: string
  courseId: string
  academicPeriodId: string
  sectionCode: string
  shift: string | null
  teacherName: string | null
  teacherEmail: string | null
  specificElectiveName?: string | null
  naturalKey: string
  sourceSheet: string
  sourceRow: number
}

export interface NormalizedMeeting {
  id: string
  sectionId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  classroom: string | null
  specialDates: string[] | null
  rawSource: string
  naturalKey: string
}

export interface NormalizedExam {
  id: string
  sectionId: string
  examType: string
  examDate: string | null
  startTime: string | null
  endTime: string | null
  classroom: string | null
  rawSource: string
  naturalKey: string
}

export interface RejectedRow {
  sheetName: string
  rowNumber: number
  reason: string
  severity: 'warning' | 'critical'
}

export interface ImportIssue {
  code: string
  message: string
  severity: 'warning' | 'critical'
  sheetName?: string
  rowNumber?: number
}

export interface NormalizedImportBundle {
  metadata: {
    sourceFile: string
    checksum: string
    importedAt: string
    academicPeriodId: string | null
    sheetsProcessed: string[]
    sheetsIgnored: string[]
  }
  careers: NormalizedCareer[]
  courses: NormalizedCourse[]
  sections: NormalizedSection[]
  meetings: NormalizedMeeting[]
  exams: NormalizedExam[]
  warnings: ImportIssue[]
  rejectedRows: RejectedRow[]
  duplicates: ImportIssue[]
}

export interface ImportReport extends NormalizedImportBundle {
  summary: {
    careers: number
    courses: number
    sections: number
    meetings: number
    exams: number
    validRows: number
    rejectedRows: number
    warnings: number
    criticalErrors: number
    duplicates: number
  }
}

export interface ImportCliOptions {
  filePath: string
  dryRun: boolean
  periodId?: string
  output?: string
  sheet?: string
  allSheets: boolean
  skipUpload: boolean
  verbose: boolean
  force: boolean
}

export interface ScheduleImportRepository {
  findExistingChecksum(checksum: string): Promise<boolean>
  getLatestVersionNumber(academicPeriodId: string): Promise<number>
  getCurrentCounts(academicPeriodId: string): Promise<{
    courses: number
    sections: number
  }>
  importBundle(input: {
    academicPeriodId: string
    checksum: string
    fileName: string
    bundle: NormalizedImportBundle
  }): Promise<{ version: number; importId: string }>
}
