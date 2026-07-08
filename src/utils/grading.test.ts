import { describe, expect, it } from 'vitest'
import scaleJson from '@/data/grading-scales/fpuna-default-scale.json'
import type { GradingScale } from '@/utils/grading'
import {
  calculateWeightedPp,
  getFinalGrade,
  getGradeScenarios,
  getMinimumEfForGrade,
} from '@/utils/grading'

const scale = scaleJson as GradingScale

// ─── Integridad de la escala ─────────────────────────────────────────────────

describe('GradingScale — integridad', () => {
  it('contiene exactamente 2601 combinaciones', () => {
    expect(scale.entries).toHaveLength(2601)
  })

  it('tiene 51 valores únicos de PP (50-100)', () => {
    const pps = new Set(scale.entries.map((e) => e.pp))
    expect(pps.size).toBe(51)
    expect(Math.min(...pps)).toBe(50)
    expect(Math.max(...pps)).toBe(100)
  })

  it('tiene 51 valores únicos de EF (50-100)', () => {
    const efs = new Set(scale.entries.map((e) => e.ef))
    expect(efs.size).toBe(51)
    expect(Math.min(...efs)).toBe(50)
    expect(Math.max(...efs)).toBe(100)
  })

  it('no contiene combinaciones duplicadas', () => {
    const seen = new Set<string>()
    for (const e of scale.entries) {
      const key = `${e.pp}:${e.ef}`
      expect(seen.has(key)).toBe(false)
      seen.add(key)
    }
  })

  it('todas las notas están entre 1 y 5', () => {
    for (const e of scale.entries) {
      expect(e.grade).toBeGreaterThanOrEqual(1)
      expect(e.grade).toBeLessThanOrEqual(5)
    }
  })

  it('tiene todas las combinaciones PP×EF sin faltantes', () => {
    const lookup = new Map(scale.entries.map((e) => [`${e.pp}:${e.ef}`, e.grade]))
    for (let pp = 50; pp <= 100; pp++) {
      for (let ef = 50; ef <= 100; ef++) {
        expect(lookup.has(`${pp}:${ef}`), `Falta PP=${pp}, EF=${ef}`).toBe(true)
      }
    }
  })
})

// ─── getFinalGrade ───────────────────────────────────────────────────────────

describe('getFinalGrade', () => {
  it('PP=100, EF=50 → 2', () => {
    const r = getFinalGrade(scale, 100, 50)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(2)
  })

  it('PP=100, EF=100 → 5', () => {
    const r = getFinalGrade(scale, 100, 100)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(5)
  })

  it('PP=50, EF=50 → 1', () => {
    const r = getFinalGrade(scale, 50, 50)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(1)
  })

  it('PP=50, EF=100 → 3', () => {
    const r = getFinalGrade(scale, 50, 100)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(3)
  })

  it('PP=73, EF=50 → 1 (justo debajo del umbral)', () => {
    const r = getFinalGrade(scale, 73, 50)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(1)
  })

  it('PP=74, EF=50 → 2 (primer PP que da nota 2 con EF=50)', () => {
    const r = getFinalGrade(scale, 74, 50)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(2)
  })

  // Transiciones verificadas en el PDF
  it('PP=100, EF=51 → 3 (transición 2→3 con PP=100)', () => {
    const r = getFinalGrade(scale, 100, 51)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(3)
  })

  it('PP=100, EF=68 → 4 (transición 3→4 con PP=100)', () => {
    const r = getFinalGrade(scale, 100, 68)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(4)
  })

  it('PP=100, EF=85 → 5 (transición 4→5 con PP=100)', () => {
    const r = getFinalGrade(scale, 100, 85)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(5)
  })

  it('PP=50, EF=66 → 2 (transición 1→2 con PP=50)', () => {
    const r = getFinalGrade(scale, 50, 66)
    expect(r.status).toBe('success')
    expect(r.grade).toBe(2)
  })

  // Entradas inválidas
  it('rechaza PP vacío', () => {
    const r = getFinalGrade(scale, '', 70)
    expect(r.status).toBe('invalid_input')
    expect(r.grade).toBeNull()
  })

  it('rechaza EF vacío', () => {
    const r = getFinalGrade(scale, 80, null)
    expect(r.status).toBe('invalid_input')
  })

  it('rechaza PP con texto', () => {
    const r = getFinalGrade(scale, 'abc', 70)
    expect(r.status).toBe('invalid_input')
  })

  it('rechaza PP con decimal', () => {
    const r = getFinalGrade(scale, 75.5, 70)
    expect(r.status).toBe('invalid_input')
  })

  it('rechaza PP fuera de rango (menor a 50)', () => {
    const r = getFinalGrade(scale, 49, 70)
    expect(r.status).toBe('out_of_range')
    expect(r.grade).toBeNull()
  })

  it('rechaza EF fuera de rango (mayor a 100)', () => {
    const r = getFinalGrade(scale, 80, 101)
    expect(r.status).toBe('out_of_range')
  })

  it('incluye sourceFile en el resultado', () => {
    const r = getFinalGrade(scale, 80, 80)
    expect(r.sourceFile).toBe('EscalaDeNotasPolitecnica.pdf')
  })
})

// ─── getMinimumEfForGrade ────────────────────────────────────────────────────

describe('getMinimumEfForGrade', () => {
  it('PP=100, objetivo=5 → EF mínimo 85', () => {
    const r = getMinimumEfForGrade(scale, 100, 5)
    expect(r.status).toBe('success')
    expect(r.minimumEf).toBe(85)
  })

  it('PP=100, objetivo=4 → EF mínimo 68', () => {
    const r = getMinimumEfForGrade(scale, 100, 4)
    expect(r.status).toBe('success')
    expect(r.minimumEf).toBe(68)
  })

  it('PP=50, objetivo=3 → EF mínimo 85', () => {
    const r = getMinimumEfForGrade(scale, 50, 3)
    expect(r.status).toBe('success')
    expect(r.minimumEf).toBe(85)
  })

  it('PP=50, objetivo=5 → imposible', () => {
    const r = getMinimumEfForGrade(scale, 50, 5)
    expect(r.status).toBe('out_of_range')
    expect(r.minimumEf).toBeNull()
  })

  it('PP=50, objetivo=4 → imposible', () => {
    const r = getMinimumEfForGrade(scale, 50, 4)
    expect(r.status).toBe('out_of_range')
    expect(r.minimumEf).toBeNull()
  })

  it('rechaza nota objetivo fuera de rango', () => {
    const r = getMinimumEfForGrade(scale, 80, 6)
    expect(r.status).toBe('invalid_input')
  })

  it('rechaza PP inválido', () => {
    const r = getMinimumEfForGrade(scale, '', 3)
    expect(r.status).toBe('invalid_input')
  })
})

// ─── getGradeScenarios ───────────────────────────────────────────────────────

describe('getGradeScenarios', () => {
  it('devuelve 51 escenarios para PP=80', () => {
    const scenarios = getGradeScenarios(scale, 80)
    expect(scenarios).toHaveLength(51)
  })

  it('los escenarios están ordenados por EF de menor a mayor', () => {
    const scenarios = getGradeScenarios(scale, 80)
    for (let i = 1; i < scenarios.length; i++) {
      expect(scenarios[i]!.ef).toBeGreaterThan(scenarios[i - 1]!.ef)
    }
  })

  it('devuelve array vacío para PP fuera de rango', () => {
    const scenarios = getGradeScenarios(scale, 49)
    expect(scenarios).toHaveLength(0)
  })

  it('devuelve array vacío para PP inválido', () => {
    const scenarios = getGradeScenarios(scale, 'abc')
    expect(scenarios).toHaveLength(0)
  })
})

describe('calculateWeightedPp', () => {
  it('calcula PP cuando los pesos suman 100%', () => {
    const result = calculateWeightedPp([
      { id: '1', name: 'Parcial 1', score: '80', weight: '50' },
      { id: '2', name: 'Parcial 2', score: '90', weight: '50' },
    ])
    expect(result.status).toBe('success')
    expect(result.pp).toBe(85)
    expect(result.totalWeight).toBe(100)
  })

  it('detecta pesos incompletos', () => {
    const result = calculateWeightedPp([
      { id: '1', name: 'Parcial 1', score: '80', weight: '30' },
    ])
    expect(result.status).toBe('incomplete')
    expect(result.message).toContain('Falta asignar 70%')
  })

  it('detecta pesos mayores a 100%', () => {
    const result = calculateWeightedPp([
      { id: '1', name: 'A', score: '80', weight: '60' },
      { id: '2', name: 'B', score: '70', weight: '50' },
    ])
    expect(result.status).toBe('overflow')
  })

  it('rechaza nombres duplicados', () => {
    const result = calculateWeightedPp([
      { id: '1', name: 'Parcial', score: '80', weight: '50' },
      { id: '2', name: 'parcial', score: '70', weight: '50' },
    ])
    expect(result.status).toBe('invalid')
  })
})
