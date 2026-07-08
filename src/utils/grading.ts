/**
 * Tipos y funciones de dominio para la escala de notas de la FP-UNA.
 *
 * La escala es un lookup directo: no existe una fórmula matemática que
 * reproduzca exactamente las 2601 combinaciones del PDF oficial.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface GradingScaleEntry {
  pp: number
  ef: number
  grade: number
}

export interface GradingScaleMeta {
  id: string
  institution: string
  name: string
  sourceFile: string
  sourceChecksum: string
  extractedAt: string
  ppRange: { min: number; max: number; step: number }
  efRange: { min: number; max: number; step: number }
  totalCombinations: number
}

export interface GradingScale extends GradingScaleMeta {
  entries: GradingScaleEntry[]
}

export type GradeResultStatus =
  | 'success'
  | 'invalid_input'
  | 'out_of_range'
  | 'unavailable'

export interface GradeResult {
  status: GradeResultStatus
  grade: number | null
  pp: number | null
  ef: number | null
  message: string
  sourceFile: string | null
  sourceChecksum: string | null
}

export interface MinimumEfResult {
  status: GradeResultStatus
  pp: number | null
  targetGrade: number | null
  minimumEf: number | null
  message: string
  sourceFile: string | null
}

export interface GradeScenario {
  ef: number
  grade: number
}

export interface WeightedEvaluation {
  id: string
  name: string
  score: string
  weight: string
}

export type WeightedPpStatus = 'empty' | 'invalid' | 'incomplete' | 'overflow' | 'success'

export interface WeightedPpResult {
  status: WeightedPpStatus
  totalWeight: number
  pp: number | null
  rawAverage: number | null
  message: string
}

export function createWeightedEvaluation(name = ''): WeightedEvaluation {
  return {
    id: crypto.randomUUID(),
    name,
    score: '',
    weight: '',
  }
}

export function parseEvaluationScore(raw: string): { value: number | null; error: string | null } {
  if (!raw.trim()) return { value: null, error: 'Ingresá un puntaje.' }
  const n = Number(raw)
  if (!Number.isFinite(n)) return { value: null, error: 'Debe ser un número válido.' }
  if (!Number.isInteger(n)) return { value: null, error: 'Usá un número entero.' }
  if (n < 0 || n > 100) return { value: null, error: 'El puntaje debe estar entre 0 y 100.' }
  return { value: n, error: null }
}

export function parseEvaluationWeight(raw: string): { value: number | null; error: string | null } {
  if (!raw.trim()) return { value: null, error: 'Ingresá un peso.' }
  const n = Number(raw)
  if (!Number.isFinite(n)) return { value: null, error: 'Debe ser un número válido.' }
  if (!Number.isInteger(n)) return { value: null, error: 'Usá un número entero.' }
  if (n < 0 || n > 100) return { value: null, error: 'El peso debe estar entre 0 y 100.' }
  return { value: n, error: null }
}

export function getDuplicateEvaluationName(
  evaluations: WeightedEvaluation[],
  currentId: string,
): string | null {
  const current = evaluations.find((item) => item.id === currentId)
  const normalized = current?.name.trim().toLowerCase()
  if (!normalized) return null

  const duplicate = evaluations.find(
    (item) => item.id !== currentId && item.name.trim().toLowerCase() === normalized,
  )
  return duplicate ? 'Ya existe una evaluación con ese nombre.' : null
}

export function calculateWeightedPp(evaluations: WeightedEvaluation[]): WeightedPpResult {
  if (evaluations.length === 0) {
    return {
      status: 'empty',
      totalWeight: 0,
      pp: null,
      rawAverage: null,
      message: 'Agregá al menos una evaluación.',
    }
  }

  let totalWeight = 0
  let weightedSum = 0
  let hasAnyInput = false

  for (const evaluation of evaluations) {
    const name = evaluation.name.trim()
    if (!name) {
      return {
        status: 'invalid',
        totalWeight,
        pp: null,
        rawAverage: null,
        message: 'Cada evaluación necesita un nombre.',
      }
    }

    const duplicate = getDuplicateEvaluationName(evaluations, evaluation.id)
    if (duplicate) {
      return {
        status: 'invalid',
        totalWeight,
        pp: null,
        rawAverage: null,
        message: duplicate,
      }
    }

    const scoreResult = parseEvaluationScore(evaluation.score)
    if (scoreResult.error) {
      return {
        status: 'invalid',
        totalWeight,
        pp: null,
        rawAverage: null,
        message: `${name}: ${scoreResult.error}`,
      }
    }

    const weightResult = parseEvaluationWeight(evaluation.weight)
    if (weightResult.error) {
      return {
        status: 'invalid',
        totalWeight,
        pp: null,
        rawAverage: null,
        message: `${name}: ${weightResult.error}`,
      }
    }

    hasAnyInput = true
    totalWeight += weightResult.value!
    weightedSum += scoreResult.value! * (weightResult.value! / 100)
  }

  if (!hasAnyInput) {
    return {
      status: 'empty',
      totalWeight: 0,
      pp: null,
      rawAverage: null,
      message: 'Completá puntajes y pesos para calcular tu PP.',
    }
  }

  if (totalWeight > 100) {
    return {
      status: 'overflow',
      totalWeight,
      pp: null,
      rawAverage: null,
      message: 'Los pesos superan el 100%.',
    }
  }

  if (totalWeight < 100) {
    return {
      status: 'incomplete',
      totalWeight,
      pp: null,
      rawAverage: weightedSum > 0 ? weightedSum : null,
      message: `Falta asignar ${100 - totalWeight}%.`,
    }
  }

  const rawAverage = weightedSum
  const pp = Math.round(rawAverage)

  return {
    status: 'success',
    totalWeight,
    pp,
    rawAverage,
    message:
      pp !== rawAverage
        ? `PP estimado ${pp} (promedio ponderado ${rawAverage.toFixed(1)}).`
        : 'Distribución completa.',
  }
}


function buildLookup(scale: GradingScale): Map<string, number> {
  const map = new Map<string, number>()
  for (const entry of scale.entries) {
    map.set(`${entry.pp}:${entry.ef}`, entry.grade)
  }
  return map
}

const lookupCache = new WeakMap<GradingScale, Map<string, number>>()

function getLookup(scale: GradingScale): Map<string, number> {
  if (!lookupCache.has(scale)) {
    lookupCache.set(scale, buildLookup(scale))
  }
  return lookupCache.get(scale)!
}

// ─── Validación de entrada ───────────────────────────────────────────────────

function parseIntegerInput(raw: unknown, label: string): { value: number | null; error: string | null } {
  if (raw === null || raw === undefined || raw === '') {
    return { value: null, error: `${label} es requerido.` }
  }
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) {
    return { value: null, error: `${label} debe ser un número válido.` }
  }
  if (!Number.isInteger(n)) {
    return { value: null, error: `${label} debe ser un número entero (sin decimales).` }
  }
  return { value: n, error: null }
}

function validateRange(
  value: number,
  label: string,
  range: { min: number; max: number },
): string | null {
  if (value < range.min || value > range.max) {
    return `${label} debe estar entre ${range.min} y ${range.max}. El valor ${value} no aparece en la escala oficial publicada.`
  }
  return null
}

// ─── Funciones de dominio ────────────────────────────────────────────────────

/**
 * Calcula la nota final dado un PP y un EF usando lookup directo en la escala.
 */
export function getFinalGrade(
  scale: GradingScale,
  ppRaw: unknown,
  efRaw: unknown,
): GradeResult {
  const { value: pp, error: ppErr } = parseIntegerInput(ppRaw, 'PP')
  if (ppErr || pp === null) {
    return { status: 'invalid_input', grade: null, pp: null, ef: null, message: ppErr ?? 'PP inválido.', sourceFile: scale.sourceFile, sourceChecksum: scale.sourceChecksum }
  }

  const { value: ef, error: efErr } = parseIntegerInput(efRaw, 'EF')
  if (efErr || ef === null) {
    return { status: 'invalid_input', grade: null, pp, ef: null, message: efErr ?? 'EF inválido.', sourceFile: scale.sourceFile, sourceChecksum: scale.sourceChecksum }
  }

  const ppRangeErr = validateRange(pp, 'PP', scale.ppRange)
  if (ppRangeErr) {
    return { status: 'out_of_range', grade: null, pp, ef, message: ppRangeErr, sourceFile: scale.sourceFile, sourceChecksum: scale.sourceChecksum }
  }

  const efRangeErr = validateRange(ef, 'EF', scale.efRange)
  if (efRangeErr) {
    return { status: 'out_of_range', grade: null, pp, ef, message: efRangeErr, sourceFile: scale.sourceFile, sourceChecksum: scale.sourceChecksum }
  }

  const lookup = getLookup(scale)
  const grade = lookup.get(`${pp}:${ef}`)

  if (grade === undefined) {
    return {
      status: 'unavailable',
      grade: null,
      pp,
      ef,
      message: `La combinación PP=${pp}, EF=${ef} no está registrada en la escala.`,
      sourceFile: scale.sourceFile,
      sourceChecksum: scale.sourceChecksum,
    }
  }

  return {
    status: 'success',
    grade,
    pp,
    ef,
    message: `Con PP ${pp} y EF ${ef} la nota final es ${grade}.`,
    sourceFile: scale.sourceFile,
    sourceChecksum: scale.sourceChecksum,
  }
}

/**
 * Calcula el EF mínimo necesario para alcanzar una nota objetivo dado un PP.
 */
export function getMinimumEfForGrade(
  scale: GradingScale,
  ppRaw: unknown,
  targetGradeRaw: unknown,
): MinimumEfResult {
  const { value: pp, error: ppErr } = parseIntegerInput(ppRaw, 'PP')
  if (ppErr || pp === null) {
    return { status: 'invalid_input', pp: null, targetGrade: null, minimumEf: null, message: ppErr ?? 'PP inválido.', sourceFile: scale.sourceFile }
  }

  const { value: targetGrade, error: tgErr } = parseIntegerInput(targetGradeRaw, 'Nota objetivo')
  if (tgErr || targetGrade === null) {
    return { status: 'invalid_input', pp, targetGrade: null, minimumEf: null, message: tgErr ?? 'Nota objetivo inválida.', sourceFile: scale.sourceFile }
  }

  const ppRangeErr = validateRange(pp, 'PP', scale.ppRange)
  if (ppRangeErr) {
    return { status: 'out_of_range', pp, targetGrade, minimumEf: null, message: ppRangeErr, sourceFile: scale.sourceFile }
  }

  if (targetGrade < 1 || targetGrade > 5) {
    return { status: 'invalid_input', pp, targetGrade, minimumEf: null, message: 'La nota objetivo debe estar entre 1 y 5.', sourceFile: scale.sourceFile }
  }

  const lookup = getLookup(scale)

  for (let ef = scale.efRange.min; ef <= scale.efRange.max; ef++) {
    const grade = lookup.get(`${pp}:${ef}`)
    if (grade !== undefined && grade >= targetGrade) {
      return {
        status: 'success',
        pp,
        targetGrade,
        minimumEf: ef,
        message: `Con PP ${pp}, necesitás EF mínimo ${ef} para alcanzar nota ${targetGrade}.`,
        sourceFile: scale.sourceFile,
      }
    }
  }

  return {
    status: 'out_of_range',
    pp,
    targetGrade,
    minimumEf: null,
    message: `Con PP ${pp} no es posible alcanzar nota ${targetGrade} con ningún EF entre ${scale.efRange.min} y ${scale.efRange.max}.`,
    sourceFile: scale.sourceFile,
  }
}

/**
 * Devuelve todos los escenarios posibles para un PP dado (EF 50-100 con su nota).
 */
export function getGradeScenarios(
  scale: GradingScale,
  ppRaw: unknown,
): GradeScenario[] {
  const { value: pp, error } = parseIntegerInput(ppRaw, 'PP')
  if (error || pp === null) return []

  const ppRangeErr = validateRange(pp, 'PP', scale.ppRange)
  if (ppRangeErr) return []

  const lookup = getLookup(scale)
  const scenarios: GradeScenario[] = []

  for (let ef = scale.efRange.min; ef <= scale.efRange.max; ef++) {
    const grade = lookup.get(`${pp}:${ef}`)
    if (grade !== undefined) {
      scenarios.push({ ef, grade })
    }
  }

  return scenarios
}
