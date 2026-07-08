import type {
  ImportIssue,
  NormalizedCareer,
  NormalizedCourse,
  NormalizedExam,
  NormalizedImportBundle,
  NormalizedMeeting,
  NormalizedSection,
  ParsedSheetRow,
  ParsedWorkbookSource,
  RejectedRow,
} from '../types'
import { stableUuid } from '../sources/LocalFileSource'
import {
  buildCourseNaturalKey,
  buildSectionNaturalKey,
  isEmptyValue,
  normalizeCareerCode,
  normalizeText,
} from './TextNormalizer'
import { parseExamDate, parseScheduleCell, parseTimeRange } from './TimeNormalizer'

const CAREER_NAMES: Record<string, string> = {
  IAE: 'Ingeniería Aeronáutica',
  ICM: 'Ingeniería Civil Mención Construcciones',
  IEK: 'Ingeniería Eléctrica Mención Electrónica',
  IEL: 'Ingeniería Eléctrica Mención Electricidad',
  IEN: 'Ingeniería Electrónica',
  IIN: 'Ingeniería Informática',
  IMK: 'Ingeniería Mecánica',
  ISP: 'Ingeniería en Sistemas de Producción',
  LCA: 'Licenciatura en Ciencias Ambientales',
  LCI: 'Licenciatura en Comercio Internacional',
  LCIk: 'Licenciatura en Comercio Internacional',
  LEL: 'Licenciatura en Electrónica',
  LGH: 'Licenciatura en Gestión Hotelera',
  TSE: 'Tecnicatura en Sistemas Eléctricos',
}

function campusName(sheetName: string): string | null {
  if (sheetName.toLowerCase().includes('villarrica')) return 'Villarrica'
  if (sheetName.toLowerCase().includes('oviedo')) return 'Coronel Oviedo'
  return null
}

export function normalizeWorkbookRows(input: {
  source: ParsedWorkbookSource
  rows: ParsedSheetRow[]
  academicPeriodId: string | null
  sheetsProcessed: string[]
  sheetsIgnored: string[]
}): NormalizedImportBundle {
  const careers = new Map<string, NormalizedCareer>()
  const courses = new Map<string, NormalizedCourse>()
  const sections = new Map<string, NormalizedSection>()
  const meetings: NormalizedMeeting[] = []
  const exams: NormalizedExam[] = []
  const warnings: ImportIssue[] = []
  const rejectedRows: RejectedRow[] = []
  const duplicates: ImportIssue[] = []

  const warn = (issue: ImportIssue) => warnings.push(issue)

  for (const row of input.rows) {
    if (isEmptyValue(row.courseName)) {
      rejectedRows.push({
        sheetName: row.sheetName,
        rowNumber: row.rowNumber,
        reason: 'Materia vacía',
        severity: 'critical',
      })
      continue
    }

    if (isEmptyValue(row.sectionCode)) {
      rejectedRows.push({
        sheetName: row.sheetName,
        rowNumber: row.rowNumber,
        reason: 'Sección no identificable',
        severity: 'critical',
      })
      continue
    }

    const careerCode = normalizeCareerCode(row.careerSigla.rawValue, row.sheetName)
    const careerId = stableUuid('career', careerCode)
    if (!careers.has(careerCode)) {
      careers.set(careerCode, {
        id: careerId,
        code: careerCode,
        name: CAREER_NAMES[careerCode] ?? `${careerCode} (${row.sheetName})`,
        faculty: 'Facultad Politécnica',
        campus: campusName(row.sheetName),
        sourceSheet: row.sheetName,
      })
    }

    const levelValue = row.level.rawValue.match(/\d+/)?.[0] ?? null
    const courseNaturalKey = buildCourseNaturalKey(careerCode, row.courseName.rawValue, levelValue)
    const courseId = stableUuid('course', courseNaturalKey)
    if (!courses.has(courseNaturalKey)) {
      courses.set(courseNaturalKey, {
        id: courseId,
        code: null,
        name: row.courseName.rawValue.trim(),
        careerId,
        level: levelValue ? Number(levelValue) : null,
        semester: row.semesterGroup.rawValue.match(/\d+/)
          ? Number(row.semesterGroup.rawValue.match(/\d+/)?.[0])
          : null,
        naturalKey: courseNaturalKey,
      })
    }

    const periodKey = input.academicPeriodId ?? 'unknown-period'
    const sectionNaturalKey = buildSectionNaturalKey(
      periodKey,
      careerCode,
      row.courseName.rawValue,
      row.sectionCode.rawValue,
      row.shift.rawValue,
    )
    const sectionId = stableUuid('section', sectionNaturalKey)

    if (sections.has(sectionNaturalKey)) {
      duplicates.push({
        code: 'DUPLICATE_SECTION',
        message: `Sección duplicada: ${row.courseName.rawValue} ${row.sectionCode.rawValue}`,
        severity: 'warning',
        sheetName: row.sheetName,
        rowNumber: row.rowNumber,
      })
      continue
    }

    sections.set(sectionNaturalKey, {
      id: sectionId,
      courseId,
      academicPeriodId: input.academicPeriodId ?? periodKey,
      sectionCode: row.sectionCode.rawValue.trim(),
      shift: row.shift.rawValue.trim() || null,
      teacherName: row.teacherName.rawValue.trim() || null,
      teacherEmail: row.teacherEmail.rawValue.trim() || null,
      naturalKey: sectionNaturalKey,
      sourceSheet: row.sheetName,
      sourceRow: row.rowNumber,
    })

    for (const weekday of row.weekdayCells) {
      if (isEmptyValue(weekday.schedule)) continue

      const range = parseScheduleCell(weekday.schedule.rawValue, warn, {
        sheetName: row.sheetName,
        rowNumber: row.rowNumber,
        dayLabel: weekday.label,
      })
      if (!range) continue

      const meetingNaturalKey = [
        sectionNaturalKey,
        weekday.dayOfWeek,
        range.startTime,
        range.endTime,
        weekday.classroom.rawValue,
      ].join('|')

      if (meetings.some((meeting) => meeting.naturalKey === meetingNaturalKey)) {
        duplicates.push({
          code: 'DUPLICATE_MEETING',
          message: `Reunión duplicada en ${weekday.label}`,
          severity: 'warning',
          sheetName: row.sheetName,
          rowNumber: row.rowNumber,
        })
        continue
      }

      meetings.push({
        id: stableUuid('meeting', meetingNaturalKey),
        sectionId,
        dayOfWeek: weekday.dayOfWeek,
        startTime: range.startTime,
        endTime: range.endTime,
        classroom: weekday.classroom.rawValue.trim() || null,
        specialDates: row.specialSaturdayDates?.rawValue
          ? [row.specialSaturdayDates.rawValue]
          : null,
        rawSource: `${weekday.label}: ${weekday.schedule.rawValue}`,
        naturalKey: meetingNaturalKey,
      })
    }

    for (const examCell of row.examCells) {
      const examDate = parseExamDate(examCell.date.rawValue)
      const timeRange = parseTimeRange(examCell.time.rawValue)
      const hasBoardMembers = examCell.boardMembers.some((member) => !isEmptyValue(member))

      if (!examDate && !timeRange && !hasBoardMembers) {
        continue
      }

      if ((examCell.date.rawValue || examCell.time.rawValue) && !examDate && !timeRange) {
        warnings.push({
          code: 'INCOMPLETE_EXAM',
          message: `Examen ${examCell.label} incompleto`,
          severity: 'warning',
          sheetName: row.sheetName,
          rowNumber: row.rowNumber,
        })
      }

      const examNaturalKey = [
        sectionNaturalKey,
        examCell.examType,
        examDate ?? '',
        timeRange?.startTime ?? '',
      ].join('|')

      exams.push({
        id: stableUuid('exam', examNaturalKey),
        sectionId,
        examType: examCell.examType,
        examDate,
        startTime: timeRange?.startTime ?? null,
        endTime: timeRange?.endTime ?? null,
        classroom: examCell.classroom.rawValue.trim() || null,
        rawSource: [examCell.date.rawValue, examCell.time.rawValue].filter(Boolean).join(' '),
        naturalKey: examNaturalKey,
      })
    }
  }

  return {
    metadata: {
      sourceFile: input.source.fileName,
      checksum: input.source.checksum,
      importedAt: new Date().toISOString(),
      academicPeriodId: input.academicPeriodId,
      sheetsProcessed: input.sheetsProcessed,
      sheetsIgnored: input.sheetsIgnored,
    },
    careers: [...careers.values()],
    courses: [...courses.values()],
    sections: [...sections.values()],
    meetings,
    exams,
    warnings,
    rejectedRows,
    duplicates,
  }
}

export { normalizeText }
