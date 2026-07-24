import { describe, expect, it } from 'vitest'
import { detectHeaderMap } from '../parsers/HeaderDetector'
import { cellToRawString } from '../normalizers/TextNormalizer'
import { parseTimeRange, parseExamDate, normalizeTime } from '../normalizers/TimeNormalizer'
import standardHeaderFixture from './fixtures/standard-header-matrix.json'

describe('HeaderDetector', () => {
  it('detecta encabezados estándar de dos filas', () => {
    const headerMap = detectHeaderMap(standardHeaderFixture as unknown[][])
    expect(headerMap).not.toBeNull()
    expect(headerMap?.format).toBe('standard')
    expect(headerMap?.weekdays.length).toBeGreaterThanOrEqual(5)
    expect(headerMap?.exams.length).toBeGreaterThanOrEqual(1)
  })

  it('no salta 2do. Final ni Mesa y no asigna aula ajena a Revisión', () => {
    const headerMap = detectHeaderMap(standardHeaderFixture as unknown[][])
    expect(headerMap).not.toBeNull()

    const byType = Object.fromEntries(
      (headerMap?.exams ?? []).map((exam) => [exam.examType, exam]),
    )

    expect(Object.keys(byType)).toEqual([
      'partial1',
      'partial2',
      'final1',
      'revision1',
      'final2',
      'revision2',
      'board',
    ])

    expect(byType.partial1).toMatchObject({ dateCol: 15, timeCol: 16, classroomCol: 17 })
    expect(byType.partial2).toMatchObject({ dateCol: 18, timeCol: 19, classroomCol: 20 })
    expect(byType.final1).toMatchObject({ dateCol: 21, timeCol: 22, classroomCol: 23 })
    expect(byType.revision1).toMatchObject({ dateCol: 24, timeCol: 25, classroomCol: undefined })
    expect(byType.final2).toMatchObject({ dateCol: 26, timeCol: 27, classroomCol: 28 })
    expect(byType.revision2).toMatchObject({ dateCol: 29, timeCol: 30, classroomCol: undefined })
    expect(byType.board).toMatchObject({
      boardMemberCols: [31, 32, 33],
      classroomCol: 34,
    })
  })

  it('detecta Evaluación primera/segunda etapa del formato 2026-2', () => {
    const matrix = [
      [],
      [
        null,
        'ASIGNATURA',
        null,
        null,
        null,
        'CARRERA',
        null,
        null,
        null,
        null,
        'Evaluación primera etapa',
        'Evaluación segunda etapa',
        '1er. Final',
        null,
        null,
        'Revisión',
        null,
        '2do. Final',
        null,
        null,
        'Revisión',
        null,
        'Mesa Examinadora',
      ],
      [
        'Item',
        'DPTO.',
        'Asignatura',
        'Nivel',
        'Sem/Grupo',
        'Sigla carrera',
        'Enfasis',
        'Plan',
        'Turno',
        'Sección',
        'Día',
        'Día',
        'Día',
        'Hora',
        'AULA',
        'Día',
        'Hora',
        'Día',
        'Hora',
        'AULA',
        'Día',
        'Hora',
        'Presidente',
        'Miembro',
        'Miembro',
        'AULA',
        'Lunes',
        'AULA',
        'Martes',
      ],
    ]

    const headerMap = detectHeaderMap(matrix)
    expect(headerMap).not.toBeNull()
    expect(headerMap?.columns.teacherLastName).toBeUndefined()
    expect(headerMap?.columns.teacherEmail).toBeUndefined()

    const byType = Object.fromEntries(
      (headerMap?.exams ?? []).map((exam) => [exam.examType, exam]),
    )
    expect(byType.partial1).toMatchObject({ dateCol: 10, timeCol: undefined })
    expect(byType.partial2).toMatchObject({ dateCol: 11, timeCol: undefined })
    expect(byType.final1).toMatchObject({ dateCol: 12, timeCol: 13, classroomCol: 14 })
    expect(byType.final2).toMatchObject({ dateCol: 17, timeCol: 18, classroomCol: 19 })
    expect(byType.board).toMatchObject({ boardMemberCols: [22, 23, 24], classroomCol: 25 })
  })
})

describe('TimeNormalizer', () => {
  it('normaliza horas en texto', () => {
    expect(normalizeTime('17:00')).toBe('17:00:00')
    expect(parseTimeRange('17:00 - 20:00')).toEqual({
      startTime: '17:00:00',
      endTime: '20:00:00',
    })
  })

  it('normaliza horas numéricas de Excel', () => {
    const range = parseTimeRange(0.625)
    expect(range).toEqual({ startTime: '15:00:00', endTime: '16:00:00' })
  })

  it('rechaza intervalos inválidos', () => {
    expect(parseTimeRange('20:00 - 17:00')).toBeNull()
  })

  it('normaliza horas fuera de rango desde Excel', () => {
    expect(normalizeTime('24:20')).toBe('00:20:00')
    expect(parseTimeRange(1 + 20 / (24 * 60))).toEqual({
      startTime: '00:20:00',
      endTime: '01:20:00',
    })
  })

  it('parsea fechas de examen', () => {
    expect(parseExamDate('Mar 07/04/26')).toBe('2026-04-07')
  })

  it('parsea serial Excel de fecha y rechaza años absurdos', () => {
    expect(parseExamDate(46360)).toMatch(/^2026-/)
    expect(parseExamDate('46360')).toMatch(/^2026-/)
    expect(parseExamDate('46360')).not.toContain('+046360')
  })

  it('parsea serial Excel 0.75 como 18:00 (no 21:50 UTC)', () => {
    expect(parseTimeRange(0.75)).toEqual({
      startTime: '18:00:00',
      endTime: '19:00:00',
    })
    expect(parseTimeRange('0.75')).toEqual({
      startTime: '18:00:00',
      endTime: '19:00:00',
    })
  })

  it('formatea Date de hora Excel como HH:mm y no como ISO UTC', () => {
    const excelTimeDate = new Date(1899, 11, 30, 18, 0, 0)
    expect(cellToRawString(excelTimeDate)).toBe('18:00')
    expect(cellToRawString(excelTimeDate)).not.toContain('T')
    expect(parseTimeRange(excelTimeDate)).toEqual({
      startTime: '18:00:00',
      endTime: '19:00:00',
    })
  })
})
