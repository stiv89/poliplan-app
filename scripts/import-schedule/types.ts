export interface ScheduleFileSource {
  url: string
  fileName: string
  checksum: string | null
  modifiedAt: string | null
}

export interface ParsedScheduleRow {
  courseCode: string | null
  courseName: string
  sectionCode: string
  dayOfWeek: number
  startTime: string
  endTime: string
  classroom: string | null
  teacherName: string | null
}

export interface ExcelScheduleParser {
  parse(filePath: string): Promise<ParsedScheduleRow[]>
}

export interface ScheduleNormalizer {
  normalize(rows: ParsedScheduleRow[]): Promise<ParsedScheduleRow[]>
}

export interface ScheduleValidationResult {
  valid: boolean
  errors: string[]
}

export interface ScheduleValidator {
  validate(rows: ParsedScheduleRow[]): ScheduleValidationResult
}

export interface ScheduleImportResult {
  rowsProcessed: number
  rowsRejected: number
  version: number
}

export interface ScheduleImporter {
  importFromFile(filePath: string, source: ScheduleFileSource): Promise<ScheduleImportResult>
}
