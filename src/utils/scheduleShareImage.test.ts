import { describe, expect, it } from 'vitest'
import type { CourseSection } from '@/types/academic'
import {
  buildScheduleShareBlocks,
  buildScheduleShareDays,
} from '@/utils/scheduleShareImage'

const coursesById = new Map([
  ['c1', { name: 'Estructura de los Lenguajes', code: 'INF301' }],
  ['c2', { name: 'Gestion de Centro de Computos', code: 'INF401' }],
])

const sections = [
  {
    id: 's1',
    courseId: 'c1',
    sectionCode: 'A',
    teacherName: 'Dr. Perez',
    meetings: [
      {
        id: 'm1',
        dayOfWeek: 1,
        startTime: '14:00',
        endTime: '16:15',
        classroom: 'Aula 1',
      },
    ],
  },
  {
    id: 's2',
    courseId: 'c2',
    sectionCode: 'TQ',
    teacherName: 'Ing. Riveros',
    meetings: [
      {
        id: 'm2',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:30',
        classroom: null,
      },
      {
        id: 'm3',
        dayOfWeek: 5,
        startTime: '17:15',
        endTime: '19:30',
        classroom: null,
      },
    ],
  },
] as CourseSection[]

describe('buildScheduleShareBlocks', () => {
  it('aplana meetings y ordena por día/hora', () => {
    const blocks = buildScheduleShareBlocks(sections, coursesById)
    expect(blocks).toHaveLength(3)
    expect(blocks.map((block) => block.dayOfWeek)).toEqual([1, 1, 5])
    expect(blocks[0]?.startTime).toBe('10:00')
    expect(blocks[0]?.shortTitle).toBe('INF401')
    expect(blocks[1]?.shortTitle).toBe('INF301')
  })
})

describe('buildScheduleShareDays', () => {
  it('agrupa materias por día y ordena por hora', () => {
    const days = buildScheduleShareDays(sections, coursesById)
    expect(days.map((day) => day.dayLabel)).toEqual(['Lunes', 'Viernes'])
    expect(days[0]?.entries.map((entry) => entry.title)).toEqual([
      'Gestion de Centro de Computos',
      'Estructura de los Lenguajes',
    ])
    expect(days[0]?.entries[0]?.startTime).toBe('10:00')
  })
})
