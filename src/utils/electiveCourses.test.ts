import { describe, expect, it } from 'vitest'
import {
  getCourseGroupingKey,
  parseElectiveCourseName,
  resolveSectionElectiveName,
} from '@/utils/electiveCourses'
import { groupSectionsByCourse } from '@/utils/sectionDisplay'
import type { CourseSection } from '@/types/academic'

describe('parseElectiveCourseName', () => {
  it('parses Excel dash format', () => {
    expect(parseElectiveCourseName('Electiva 1 - Big Data')).toEqual({
      slot: 'Electiva 1',
      specificName: 'Big Data',
    })
  })

  it('parses dash format with footnote', () => {
    expect(parseElectiveCourseName('Electiva 1 - Data Science (*)')).toEqual({
      slot: 'Electiva 1',
      specificName: 'Data Science',
    })
  })

  it('parses loose dash without space', () => {
    expect(parseElectiveCourseName('Electiva 5- Desempeño y Seguridad de las Redes')).toEqual({
      slot: 'Electiva 5',
      specificName: 'Desempeño y Seguridad de las Redes',
    })
  })

  it('parses transcript parentheses format', () => {
    expect(parseElectiveCourseName('ELECTIVA 1 ( PROGRAMACION WEB FRONT-END )')).toEqual({
      slot: 'Electiva 1',
      specificName: 'PROGRAMACION WEB FRONT-END',
    })
  })

  it('parses slot-only names', () => {
    expect(parseElectiveCourseName('Optativa 2')).toEqual({
      slot: 'Optativa 2',
      specificName: null,
    })
  })

  it('returns null for regular courses', () => {
    expect(parseElectiveCourseName('Bases de Datos I')).toEqual({
      slot: null,
      specificName: null,
    })
  })
})

describe('groupSectionsByCourse electives', () => {
  const coursesById = new Map([
    [
      'c1',
      {
        name: 'Electiva 1 - Big Data',
        code: null,
        level: 7,
        semester: 7,
        careerId: 'career-iin',
      },
    ],
    [
      'c2',
      {
        name: 'Electiva 1 - Blockchain',
        code: null,
        level: 7,
        semester: 7,
        careerId: 'career-iin',
      },
    ],
  ])

  const section = (id: string, courseId: string, code: string): CourseSection => ({
    id,
    courseId,
    academicPeriodId: 'period',
    sectionCode: code,
    shift: 'Tarde',
    teacherName: `Prof ${id}`,
    teacherEmail: null,
    teacherId: null,
    meetings: [],
    exams: [],
  })

  it('groups elective variants under one course card', () => {
    const groups = groupSectionsByCourse(
      [section('s1', 'c1', 'TQ'), section('s2', 'c2', 'TQ')],
      coursesById,
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.courseDisplayName).toBe('Electiva 1')
    expect(groups[0]?.sections).toHaveLength(2)
  })

  it('uses stored specific elective name when available', () => {
    const value = resolveSectionElectiveName(
      {
        sectionCode: 'TQ',
        specificElectiveName: 'Machine Learning',
      },
      { name: 'Electiva 1' },
    )

    expect(value).toBe('Machine Learning')
  })

  it('builds stable elective grouping keys', () => {
    expect(getCourseGroupingKey('c1', coursesById.get('c1'))).toBe(
      getCourseGroupingKey('c2', coursesById.get('c2')),
    )
  })
})
