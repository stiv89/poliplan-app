import { describe, expect, it } from 'vitest'
import {
  filterAndRankByFuzzySearch,
  normalizeSearchText,
  scoreFuzzyMatch,
} from '@/utils/fuzzySearch'

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
})
