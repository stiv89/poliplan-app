import { describe, expect, it } from 'vitest'
import { shortCourseLabel } from '@/components/schedule/ClassBlockDetail'

describe('ClassBlockDetail helpers', () => {
  it('shortCourseLabel prefers course code', () => {
    expect(shortCourseLabel('Probabilidades y Estadística', 'EST100')).toBe('EST100')
  })

  it('shortCourseLabel truncates long names', () => {
    expect(shortCourseLabel('Diseño de Compiladores Avanzado', null, 12)).toBe('Diseño de C…')
  })
})
