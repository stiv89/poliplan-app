import { describe, expect, it } from 'vitest'
import { normalizeTime } from '@/utils/normalization'

describe('normalizeTime', () => {
  it('normaliza horarios con y sin segundos', () => {
    expect(normalizeTime('8:5')).toBe('08:05:00')
    expect(normalizeTime('17:30')).toBe('17:30:00')
    expect(normalizeTime('09:15:00')).toBe('09:15:00')
  })
})
