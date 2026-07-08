import { describe, expect, it } from 'vitest'
import { detectHeaderMap } from '../parsers/HeaderDetector'
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
})
