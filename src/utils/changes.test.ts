import { describe, expect, it } from 'vitest'
import type { ScheduleChange } from '@/types/academic'
import {
  filterChanges,
  formatChangeValue,
  getChangeSummary,
  groupChangesByRecency,
  isExamChange,
} from '@/utils/changes'

function makeChange(overrides: Partial<ScheduleChange> = {}): ScheduleChange {
  return {
    id: '1',
    entityType: 'meeting',
    sectionId: 'sec-1',
    sectionCode: 'A',
    courseId: 'course-1',
    courseName: 'Matemática Discreta',
    field: 'meetingClassroom',
    previousValue: 'Aula 205',
    newValue: 'Aula 310',
    severity: 'important',
    detectedAt: new Date().toISOString(),
    versionFrom: 1,
    versionTo: 2,
    seen: false,
    ...overrides,
  }
}

describe('changes utils', () => {
  it('identifies exam changes', () => {
    expect(isExamChange(makeChange({ field: 'examDate', entityType: 'exam' }))).toBe(true)
    expect(isExamChange(makeChange({ field: 'meetingDay' }))).toBe(false)
  })

  it('filters by exams and schedule', () => {
    const changes = [
      makeChange({ id: '1', field: 'examDate', entityType: 'exam' }),
      makeChange({ id: '2', field: 'meetingDay' }),
      makeChange({ id: '3', field: 'sectionAdded', sectionId: 'new-sec' }),
    ]
    const selected = new Set(['sec-1'])

    expect(filterChanges(changes, 'exams', selected)).toHaveLength(1)
    expect(filterChanges(changes, 'mine', selected)).toHaveLength(2)
    expect(filterChanges(changes, 'all', selected)).toHaveLength(3)
  })

  it('formats meeting day values', () => {
    expect(formatChangeValue('meetingDay', '2')).toBe('Martes')
  })

  it('builds human summaries', () => {
    expect(getChangeSummary(makeChange({ field: 'sectionRemoved' }))).toContain('eliminó')
    expect(getChangeSummary(makeChange({ field: 'examDate', entityType: 'exam' }))).toContain(
      'fecha',
    )
  })

  it('groups changes by recency', () => {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const changes = [
      makeChange({ id: 'today', detectedAt: now.toISOString() }),
      makeChange({ id: 'yesterday', detectedAt: yesterday.toISOString() }),
      makeChange({ id: 'older', detectedAt: '2020-01-01T10:00:00.000Z' }),
    ]

    const groups = groupChangesByRecency(changes)
    expect(groups.map((group) => group.label)).toEqual(['Hoy', 'Ayer', 'Anteriores'])
  })
})
