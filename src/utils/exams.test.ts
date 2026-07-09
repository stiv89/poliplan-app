import { describe, expect, it } from 'vitest'
import {
  categorizeExamType,
  filterExamItems,
  formatExamTypeLabel,
  getNextExam,
  groupExamsByDate,
  todayKey,
  type ExamItem,
} from '@/utils/exams'

const sampleExam = (overrides: Partial<ExamItem> = {}): ExamItem => ({
  id: 'e1',
  sectionId: 's1',
  examType: 'Primer parcial',
  examDate: '2026-04-06',
  startTime: '18:00:00',
  endTime: '20:00:00',
  classroom: 'B03',
  courseId: 'c1',
  courseName: 'Matemática Discreta',
  courseCode: 'INF102',
  sectionCode: 'A',
  academicPeriodId: 'p1',
  ...overrides,
})

describe('exams utils', () => {
  it('categoriza tipos de examen', () => {
    expect(categorizeExamType('Primer parcial')).toBe('parcial')
    expect(categorizeExamType('Primera final')).toBe('final')
    expect(categorizeExamType('Recuperatorio')).toBe('recuperatorio')
    expect(categorizeExamType('partial2')).toBe('parcial')
    expect(categorizeExamType('final1')).toBe('final')
    expect(categorizeExamType('revision1')).toBe('recuperatorio')
  })

  it('formatea claves internas del importador en español', () => {
    expect(formatExamTypeLabel('partial2')).toBe('2do parcial')
    expect(formatExamTypeLabel('Partial2')).toBe('2do parcial')
    expect(formatExamTypeLabel('final1')).toBe('1er final')
    expect(formatExamTypeLabel('revision1')).toBe('Revisión')
    expect(formatExamTypeLabel('board')).toBe('Mesa examinadora')
    expect(formatExamTypeLabel('Primer parcial')).toBe('Primer parcial')
    expect(formatExamTypeLabel('Parcial 1')).toBe('1er parcial')
  })

  it('filtra por tipo', () => {
    const exams = [
      sampleExam({ id: '1', examType: 'Primer parcial' }),
      sampleExam({ id: '2', examType: 'Primera final' }),
    ]
    const filtered = filterExamItems(exams, { type: 'parcial' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe('1')
  })

  it('agrupa por fecha', () => {
    const groups = groupExamsByDate([
      sampleExam({ id: '1', examDate: '2026-04-10' }),
      sampleExam({ id: '2', examDate: '2026-04-06' }),
      sampleExam({ id: '3', examDate: '2026-04-06', startTime: '08:00:00' }),
    ])
    expect(groups).toHaveLength(2)
    expect(groups[0]?.date).toBe('2026-04-06')
    expect(groups[0]?.exams).toHaveLength(2)
  })

  it('encuentra el próximo examen', () => {
    const next = getNextExam(
      [
        sampleExam({ id: 'past', examDate: '2020-01-01' }),
        sampleExam({ id: 'future', examDate: '2099-05-01' }),
      ],
      todayKey(),
    )
    expect(next?.id).toBe('future')
  })
})
