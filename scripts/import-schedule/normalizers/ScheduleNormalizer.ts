import type { ParsedScheduleRow, ScheduleNormalizer } from '../types'
import { normalizeTime } from '../../../src/utils/normalization'

export class DefaultScheduleNormalizer implements ScheduleNormalizer {
  async normalize(rows: ParsedScheduleRow[]): Promise<ParsedScheduleRow[]> {
    return rows.map((row) => ({
      ...row,
      courseCode: row.courseCode?.trim() ?? null,
      courseName: row.courseName.trim(),
      sectionCode: row.sectionCode.trim(),
      startTime: normalizeTime(row.startTime),
      endTime: normalizeTime(row.endTime),
      classroom: row.classroom?.trim() ?? null,
      teacherName: row.teacherName?.trim() ?? null,
    }))
  }
}
