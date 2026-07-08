import { describe, expect, it } from 'vitest'
import {
  filterAndRankByFuzzySearch,
  filterAndRankSections,
  normalizeSearchText,
  scoreFuzzyMatch,
  scoreSectionSearchMatch,
} from '@/utils/fuzzySearch'
import { groupSectionsByCourse } from '@/utils/sectionDisplay'
import type { CourseSection } from '@/types/academic'

describe('fuzzySearch', () => {
  it('normaliza acentos y mayúsculas', () => {
    expect(normalizeSearchText('Matemática Discreta')).toBe('matematica discreta')
  })

  it('prioriza coincidencias exactas', () => {
    const exact = scoreFuzzyMatch('algebra', 'Algebra I')
    const typo = scoreFuzzyMatch('algebrra', 'Algebra I')
    expect(exact).toBeGreaterThan(typo)
    expect(exact).toBeGreaterThanOrEqual(88)
  })

  it('tolera errores de tipeo', () => {
    expect(scoreFuzzyMatch('matematica', 'Matematica Discreta')).toBeGreaterThanOrEqual(45)
    expect(scoreFuzzyMatch('matamtica discr', 'Matematica Discreta')).toBeGreaterThanOrEqual(45)
    expect(scoreFuzzyMatch('algoritmo', 'Algoritmos y Estructuras de Datos')).toBeGreaterThanOrEqual(45)
  })

  it('ordena resultados por relevancia', () => {
    const items = [
      { id: '1', label: 'Fisica General' },
      { id: '2', label: 'Matematica Discreta' },
      { id: '3', label: 'Matematica Superior' },
    ]

    const ranked = filterAndRankByFuzzySearch(items, 'matematica', (item) => item.label)
    expect(ranked.map((item) => item.id)).toEqual(['2', '3'])
  })

  it('prioriza materias con el término en el nombre', () => {
    const coursesById = new Map([
      ['c-alg', { name: 'Algebra Lineal', code: 'MAT101' }],
      ['c-ges', { name: 'Gestion Empresarial', code: 'ADM210' }],
      ['c-ads', { name: 'Algoritmos y Estructuras de Datos I', code: 'INF201' }],
    ])

    const sections = [
      { id: 's1', courseId: 'c-alg', sectionCode: 'MI', teacherName: 'Prof. A' },
      { id: 's2', courseId: 'c-ges', sectionCode: 'TS', teacherName: 'Prof. B' },
      { id: 's3', courseId: 'c-ads', sectionCode: 'TS', teacherName: 'Prof. C' },
    ] as CourseSection[]

    const ranked = filterAndRankSections(sections, 'gestion', coursesById)
    expect(ranked[0]?.courseId).toBe('c-ges')
    expect(ranked.some((section) => section.courseId === 'c-alg')).toBe(false)
    expect(ranked.some((section) => section.courseId === 'c-ads')).toBe(false)
  })

  it('no usa subsecuencias débiles en metadatos para materias no relacionadas', () => {
    expect(
      scoreSectionSearchMatch(
        'gestion',
        { sectionCode: 'TS', teacherName: 'Prof. Villasanti', specificElectiveName: null },
        { name: 'Algebra Lineal', code: 'MAT101' },
      ),
    ).toBe(0)
  })

  it('conserva el orden de búsqueda al agrupar por materia', () => {
    const coursesById = new Map([
      ['c-alg', { name: 'Algebra Lineal', code: 'MAT101', level: 2, semester: 2 }],
      ['c-ges', { name: 'Gestion Empresarial', code: 'ADM210', level: 4, semester: 7 }],
    ])

    const sections = [
      { id: 's-ges', courseId: 'c-ges', sectionCode: 'A', teacherName: null },
      { id: 's-alg', courseId: 'c-alg', sectionCode: 'B', teacherName: null },
    ] as CourseSection[]

    const groups = groupSectionsByCourse(sections, coursesById, { preserveOrder: true })
    expect(groups.map((group) => group.courseId)).toEqual(['c-ges', 'c-alg'])
  })
})
