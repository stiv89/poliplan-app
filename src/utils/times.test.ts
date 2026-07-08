import { describe, expect, it } from 'vitest'
import {
  formatOverlapDuration,
  getOverlapDurationMinutes,
} from '@/utils/times'

describe('getOverlapDurationMinutes', () => {
  it('calcula minutos entre dos horas', () => {
    expect(getOverlapDurationMinutes('17:15', '19:00')).toBe(105)
    expect(getOverlapDurationMinutes('18:00', '18:45')).toBe(45)
  })
})

describe('formatOverlapDuration', () => {
  it('formatea solo minutos', () => {
    expect(formatOverlapDuration(45)).toBe('45 min')
  })

  it('formatea horas exactas', () => {
    expect(formatOverlapDuration(60)).toBe('1 h')
    expect(formatOverlapDuration(120)).toBe('2 h')
  })

  it('formatea horas y minutos', () => {
    expect(formatOverlapDuration(105)).toBe('1 h 45 min')
    expect(formatOverlapDuration(90)).toBe('1 h 30 min')
  })
})
