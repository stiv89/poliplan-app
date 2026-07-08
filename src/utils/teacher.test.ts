import { describe, expect, it } from 'vitest'
import {
  formatRelativeReviewDate,
  normalizeTeacherName,
  ratingToPercent,
  teacherDedupKey,
} from '@/utils/teacher'

describe('normalizeTeacherName', () => {
  it('normaliza títulos y espacios', () => {
    expect(normalizeTeacherName('  Dr. García, Juan  ')).toBe('garcia, juan')
    expect(normalizeTeacherName('Prof. Ana Ríos')).toBe('ana rios')
  })

  it('retorna null para vacío', () => {
    expect(normalizeTeacherName('')).toBeNull()
    expect(normalizeTeacherName(null)).toBeNull()
  })
})

describe('teacherDedupKey', () => {
  it('prioriza email sobre nombre', () => {
    expect(teacherDedupKey('Prof. X', 'Docente@FPUNA.edu.py')).toBe('email:docente@fpuna.edu.py')
  })

  it('usa nombre normalizado sin email', () => {
    expect(teacherDedupKey('Prof. Ana Ríos', null)).toBe('name:ana rios')
  })
})

describe('ratingToPercent', () => {
  it('convierte rating 1-5 a porcentaje', () => {
    expect(ratingToPercent(5)).toBe(100)
    expect(ratingToPercent(4)).toBe(80)
  })
})

describe('formatRelativeReviewDate', () => {
  it('formatea fechas recientes', () => {
    const today = new Date().toISOString()
    expect(formatRelativeReviewDate(today)).toBe('Hoy')
  })
})
