import { describe, expect, it } from 'vitest'
import type { CourseSection } from '@/types/academic'
import { detectScheduleConflicts } from '@/utils/conflicts'

function createSection(
  id: string,
  meetings: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }>,
): CourseSection {
  return {
    id,
    courseId: `course-${id}`,
    academicPeriodId: 'period-1',
    sectionCode: id,
    shift: 'Mañana',
    teacherName: 'Docente',
    teacherEmail: null,
    meetings: meetings.map((meeting) => ({
      sectionId: id,
      classroom: 'Aula',
      specialDates: null,
      ...meeting,
    })),
    exams: [],
  }
}

describe('detectScheduleConflicts', () => {
  it('detecta horarios exactamente iguales', () => {
    const sections = [
      createSection('s1', [
        { id: 'm1', dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00' },
      ]),
      createSection('s2', [
        { id: 'm2', dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00' },
      ]),
    ]

    const conflicts = detectScheduleConflicts(sections)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.type).toBe('exact')
  })

  it('detecta superposición parcial', () => {
    const sections = [
      createSection('s1', [
        { id: 'm1', dayOfWeek: 1, startTime: '17:00:00', endTime: '19:00:00' },
      ]),
      createSection('s2', [
        { id: 'm2', dayOfWeek: 1, startTime: '18:00:00', endTime: '20:00:00' },
      ]),
    ]

    const conflicts = detectScheduleConflicts(sections)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.type).toBe('partial')
    expect(conflicts[0]?.overlapStart).toBe('18:00')
    expect(conflicts[0]?.overlapEnd).toBe('19:00')
  })

  it('detecta una clase contenida dentro de otra', () => {
    const sections = [
      createSection('s1', [
        { id: 'm1', dayOfWeek: 2, startTime: '08:00:00', endTime: '12:00:00' },
      ]),
      createSection('s2', [
        { id: 'm2', dayOfWeek: 2, startTime: '09:00:00', endTime: '10:00:00' },
      ]),
    ]

    const conflicts = detectScheduleConflicts(sections)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.type).toBe('contained')
  })

  it('detecta reuniones semanales duplicadas de la misma sección', () => {
    const sections = [
      createSection('s1', [
        { id: 'm1', dayOfWeek: 3, startTime: '10:00:00', endTime: '12:00:00' },
        { id: 'm2', dayOfWeek: 3, startTime: '10:30:00', endTime: '11:30:00' },
      ]),
    ]

    const conflicts = detectScheduleConflicts(sections)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]?.type).toBe('duplicate')
  })

  it('no genera conflicto entre días distintos', () => {
    const sections = [
      createSection('s1', [
        { id: 'm1', dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00' },
      ]),
      createSection('s2', [
        { id: 'm2', dayOfWeek: 2, startTime: '08:00:00', endTime: '10:00:00' },
      ]),
    ]

    expect(detectScheduleConflicts(sections)).toHaveLength(0)
  })

  it('no genera conflicto entre horarios consecutivos', () => {
    const sections = [
      createSection('s1', [
        { id: 'm1', dayOfWeek: 4, startTime: '17:00:00', endTime: '18:00:00' },
      ]),
      createSection('s2', [
        { id: 'm2', dayOfWeek: 4, startTime: '18:00:00', endTime: '19:00:00' },
      ]),
    ]

    expect(detectScheduleConflicts(sections)).toHaveLength(0)
  })
})
