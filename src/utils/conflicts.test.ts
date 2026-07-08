import { describe, expect, it } from 'vitest'
import type { CourseSection } from '@/types/academic'
import { detectScheduleConflicts, getMeetingConflictDetails } from '@/utils/conflicts'

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
    teacherId: null,
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

describe('getMeetingConflictDetails', () => {
  it('solo incluye conflictos del día y horario de la reunión', () => {
    const sections = [
      createSection('gestion', [
        { id: 'g-mon', dayOfWeek: 1, startTime: '17:15:00', endTime: '19:30:00' },
        { id: 'g-wed', dayOfWeek: 3, startTime: '17:15:00', endTime: '19:30:00' },
      ]),
      createSection('compiladores', [
        { id: 'c-mon', dayOfWeek: 1, startTime: '16:00:00', endTime: '19:00:00' },
        { id: 'c-wed', dayOfWeek: 3, startTime: '16:00:00', endTime: '19:00:00' },
      ]),
    ]

    const conflicts = detectScheduleConflicts(sections)
    expect(conflicts).toHaveLength(2)

    const mondayDetails = getMeetingConflictDetails(
      'gestion',
      1,
      '17:15:00',
      '19:30:00',
      conflicts,
    )
    expect(mondayDetails).toHaveLength(1)
    expect(mondayDetails[0]?.otherSectionId).toBe('compiladores')

    const wednesdayDetails = getMeetingConflictDetails(
      'gestion',
      3,
      '17:15:00',
      '19:30:00',
      conflicts,
    )
    expect(wednesdayDetails).toHaveLength(1)
    expect(wednesdayDetails[0]?.otherSectionId).toBe('compiladores')
  })

  it('no incluye conflictos de otras reuniones de la misma sección', () => {
    const sections = [
      createSection('gestion', [
        { id: 'g-mon', dayOfWeek: 1, startTime: '17:15:00', endTime: '19:30:00' },
        { id: 'g-wed', dayOfWeek: 3, startTime: '17:15:00', endTime: '19:30:00' },
      ]),
      createSection('compiladores', [
        { id: 'c-mon', dayOfWeek: 1, startTime: '16:00:00', endTime: '19:00:00' },
      ]),
    ]

    const conflicts = detectScheduleConflicts(sections)
    const wednesdayDetails = getMeetingConflictDetails(
      'gestion',
      3,
      '17:15:00',
      '19:30:00',
      conflicts,
    )
    expect(wednesdayDetails).toHaveLength(0)
  })

  it('agrupa varios choques con la misma materia en una sola entrada', () => {
    const sections = [
      createSection('gestion', [
        { id: 'g1', dayOfWeek: 1, startTime: '17:15:00', endTime: '19:30:00' },
      ]),
      createSection('compiladores', [
        { id: 'c1', dayOfWeek: 1, startTime: '16:00:00', endTime: '19:00:00' },
        { id: 'c2', dayOfWeek: 1, startTime: '17:30:00', endTime: '19:30:00' },
      ]),
    ]

    const conflicts = detectScheduleConflicts(sections)
    expect(conflicts.length).toBeGreaterThan(1)

    const details = getMeetingConflictDetails(
      'gestion',
      1,
      '17:15:00',
      '19:30:00',
      conflicts,
    )
    expect(details).toHaveLength(1)
    expect(details[0]?.otherSectionId).toBe('compiladores')
  })
})
