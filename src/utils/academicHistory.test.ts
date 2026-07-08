import { describe, expect, it } from 'vitest'
import iinCurriculum from '@/data/curricula/iin-default.json'
import type { AcademicAttempt, Curriculum } from '@/types/academicHistory'
import {
  calculateGpa,
  deriveAttemptStatus,
  deriveCourseStatusFromAttempts,
  getBestGrade,
  isPassingGrade,
} from '@/utils/academicApproval'
import { matchCourseToCatalog, normalizeCourseName, parseElectiveSlot } from '@/utils/courseMatching'
import { parseTranscriptText } from '@/utils/transcriptParser'
import {
  calculateProgressSummary,
  deriveStudentCourseStatuses,
  getPendingCourses,
  isSemesterComplete,
} from '@/utils/progress'

const curriculum = iinCurriculum as Curriculum

function attempt(
  overrides: Partial<AcademicAttempt> & Pick<AcademicAttempt, 'matchedCourseId' | 'originalCourseName'>,
): AcademicAttempt {
  return {
    id: crypto.randomUUID(),
    localProfileId: 'local',
    normalizedCourseName: normalizeCourseName(overrides.originalCourseName),
    status: 'passed',
    source: 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

const SAMPLE_TRANSCRIPT = `
1ER. SEMESTRE (COMPLETO)
1) MATEMATICA DISCRETA 13/11/2021 6527 61 3 (Tres)
6) ALGORITMOS Y ESTRUCTURA DE DATOS I 11/12/2021 6738 40 1 (Uno)
7) ALGORITMOS Y ESTRUCTURA DE DATOS I 14/06/2022 6820 66 3 (Tres)
35) ELECTIVA 1 ( PROGRAMACION WEB FRONT-END ) 25/11/2024 8167 85 4 (Cuatro)
Extensión Universitaria (COMPLETO)
46) Creditos en Actividades de Extension Universitaria 28/08/2025
PROMEDIO: 3.64
`

describe('academic approval', () => {
  it('marks grades 2-5 as passing', () => {
    expect(isPassingGrade(2)).toBe(true)
    expect(isPassingGrade(5)).toBe(true)
    expect(isPassingGrade(1)).toBe(false)
  })

  it('derives passed after failed attempt', () => {
    const status = deriveCourseStatusFromAttempts([
      { status: 'failed', finalGrade: 1 },
      { status: 'passed', finalGrade: 3 },
    ])
    expect(status).toBe('passed')
  })

  it('keeps best grade', () => {
    expect(getBestGrade([1, 3, 2])).toBe(3)
  })

  it('calculates gpa', () => {
    expect(calculateGpa([3, 4, 5])).toBe(4)
  })

  it('marks grade 1 as failed attempt', () => {
    expect(deriveAttemptStatus(1)).toBe('failed')
  })
})

describe('course matching', () => {
  it('matches elective slot with specific name', () => {
    const parsed = parseElectiveSlot('ELECTIVA 1 ( PROGRAMACION WEB FRONT-END )')
    expect(parsed.slot).toBe('Electiva 1')
    expect(parsed.specificName).toBe('PROGRAMACION WEB FRONT-END')
  })

  it('normalizes accents for comparison', () => {
    expect(normalizeCourseName('Matemática Discreta')).toBe(
      normalizeCourseName('MATEMATICA DISCRETA'),
    )
  })

  it('finds exact catalog match', () => {
    const match = matchCourseToCatalog('MATEMATICA DISCRETA', curriculum.courses)
    expect(match.courseId).toBe('iin-s1-md')
    expect(match.confidence).toBe('exact')
  })
})

describe('transcript parser', () => {
  it('parses repeated attempts and electives', () => {
    const { rows, gpa } = parseTranscriptText(SAMPLE_TRANSCRIPT, curriculum.courses)
    const aed = rows.filter((r) => r.normalizedCourseName.includes('ALGORITMOS Y ESTRUCTURA DE DATOS 1'))
    expect(aed.length).toBeGreaterThanOrEqual(2)
    expect(rows.some((r) => r.electiveSlot === 'Electiva 1')).toBe(true)
    expect(rows.some((r) => r.isExtension)).toBe(true)
    expect(gpa).toBe(3.64)
  })

  it('flags unrecognized rows', () => {
    const text = '1) MATERIA INVENTADA 01/01/2020 1 10 10 1 (Uno)'
    const { rows } = parseTranscriptText(text, curriculum.courses)
    expect(rows[0]?.matchConfidence).toBe('none')
  })
})

describe('progress', () => {
  it('counts pending courses without correlatives logic', () => {
    const attempts = [
      attempt({ matchedCourseId: 'iin-s1-md', originalCourseName: 'Matemática Discreta', finalGrade: 3, status: 'passed' }),
    ]
    const statuses = deriveStudentCourseStatuses(curriculum, attempts)
    const pending = getPendingCourses(curriculum, statuses)
    expect(pending.some((c) => c.id === 'iin-s1-md')).toBe(false)
    expect(pending.length).toBeGreaterThan(0)
  })

  it('marks semester complete when all courses passed', () => {
    const semester1 = curriculum.courses.filter((c) => c.semesterNumber === 1 && c.type !== 'extension')
    const attempts = semester1.map((course) =>
      attempt({
        matchedCourseId: course.id,
        originalCourseName: course.name,
        finalGrade: 3,
        status: 'passed',
      }),
    )
    const statuses = deriveStudentCourseStatuses(curriculum, attempts)
    expect(isSemesterComplete(1, curriculum, statuses)).toBe(true)
  })

  it('calculates progress by courses and credits', () => {
    const attempts = curriculum.courses
      .filter((c) => c.type === 'required' && c.semesterNumber === 1)
      .map((course) =>
        attempt({
          matchedCourseId: course.id,
          originalCourseName: course.name,
          finalGrade: 4,
          status: 'passed',
        }),
      )

    const summary = calculateProgressSummary(
      { careerName: 'IIN', importedGpa: 3.64 },
      curriculum,
      attempts,
    )

    expect(summary.passedCourses).toBe(6)
    expect(summary.earnedCredits).toBeGreaterThan(0)
    expect(summary.gpa).toBe(3.64)
  })

  it('supports course passed without grade', () => {
    const attempts = [
      attempt({
        matchedCourseId: 'iin-s1-emp',
        originalCourseName: 'Emprendedorismo',
        finalGrade: null,
        status: 'passed',
      }),
    ]
    const statuses = deriveStudentCourseStatuses(curriculum, attempts)
    expect(statuses.find((s) => s.courseId === 'iin-s1-emp')?.status).toBe('passed')
  })
})
