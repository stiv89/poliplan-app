import { describe, expect, it } from 'vitest'
import { ImportValidator } from '../validators/ImportValidator'
import type { NormalizedImportBundle } from '../types'

const baseBundle: NormalizedImportBundle = {
  metadata: {
    sourceFile: 'test.xlsx',
    checksum: 'abc',
    importedAt: new Date().toISOString(),
    academicPeriodId: null,
    sheetsProcessed: ['IIN'],
    sheetsIgnored: [],
  },
  careers: [{ id: '1', code: 'IIN', name: 'IIN', faculty: null, campus: null, sourceSheet: 'IIN' }],
  courses: Array.from({ length: 6 }).map((_, index) => ({
    id: `c-${index}`,
    code: null,
    name: `Course ${index}`,
    careerId: '1',
    level: 1,
    semester: 1,
    naturalKey: `course-${index}`,
  })),
  sections: Array.from({ length: 12 }).map((_, index) => ({
    id: `s-${index}`,
    courseId: `c-${index % 6}`,
    academicPeriodId: 'period',
    sectionCode: 'A',
    shift: 'M',
    teacherName: 'Docente',
    teacherEmail: null,
    naturalKey: `section-${index}`,
    sourceSheet: 'IIN',
    sourceRow: index + 12,
  })),
  meetings: [],
  exams: [],
  warnings: [],
  rejectedRows: [],
  duplicates: [],
}

describe('ImportValidator', () => {
  it('detecta errores críticos cuando faltan mínimos', () => {
    const issues = new ImportValidator().validate({
      ...baseBundle,
      courses: [],
      sections: [],
    })
    expect(issues.some((issue) => issue.code === 'MIN_COURSES')).toBe(true)
    expect(issues.some((issue) => issue.code === 'MIN_SECTIONS')).toBe(true)
  })

  it('permite bundle válido', () => {
    const issues = new ImportValidator().validate(baseBundle)
    expect(new ImportValidator().hasCriticalErrors(issues)).toBe(false)
  })
})
