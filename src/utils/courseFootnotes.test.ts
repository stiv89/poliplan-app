import { describe, expect, it } from 'vitest'
import { getCourseFootnote, isFinalExamOnlyCourse } from '@/utils/courseFootnotes'

describe('courseFootnotes', () => {
  it('detecta materias solo DEF con (*)', () => {
    const info = getCourseFootnote('Bases de Datos I (*)')
    expect(info.kind).toBe('final_exam_only')
    expect(info.displayName).toBe('Bases de Datos I')
    expect(isFinalExamOnlyCourse('Bases de Datos I (*)')).toBe(true)
  })

  it('detecta materias con prácticas de laboratorio (**)', () => {
    const info = getCourseFootnote('Algoritmos y Estructuras de Datos I (**)')
    expect(info.kind).toBe('lab_practices')
    expect(info.displayName).toBe('Algoritmos y Estructuras de Datos I')
    expect(isFinalExamOnlyCourse('Algoritmos y Estructuras de Datos I (**)')).toBe(false)
  })

  it('deja nombres sin marcadores intactos', () => {
    const info = getCourseFootnote('Cálculo I')
    expect(info.kind).toBeNull()
    expect(info.displayName).toBe('Cálculo I')
  })
})
