import { describe, expect, it } from 'vitest'
import {
  formatSectionCodeWithShift,
  resolveSectionShift,
  shiftFromSectionCode,
} from '@/utils/sectionCode'

describe('sectionCode', () => {
  it('deduce turno desde la primera letra del código', () => {
    expect(shiftFromSectionCode('MI')).toBe('Mañana')
    expect(shiftFromSectionCode('TQ')).toBe('Tarde')
    expect(shiftFromSectionCode('NJ')).toBe('Noche')
  })

  it('prioriza turno explícito sobre el código', () => {
    expect(resolveSectionShift({ sectionCode: 'MI', shift: 'Noche' })).toBe('Noche')
  })

  it('usa el código cuando no hay turno cargado', () => {
    expect(resolveSectionShift({ sectionCode: 'TQ', shift: null })).toBe('Tarde')
  })

  it('formatea código con turno', () => {
    expect(formatSectionCodeWithShift({ sectionCode: 'MI', shift: null })).toBe('MI · Mañana')
  })
})
