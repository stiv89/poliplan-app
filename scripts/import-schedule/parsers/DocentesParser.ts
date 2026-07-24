import { normalizeComparable, normalizeText } from '../normalizers/TextNormalizer'

export type TeacherLookup = Map<string, string>

function teacherKey(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => normalizeComparable(part ?? ''))
    .filter(Boolean)
    .join('|')
}

/**
 * Parsea la hoja "Docentes" del formato 2026-2:
 * Sede | Dpto | Asignatura | Carrera | Plan | Turno | Docente
 */
export function parseDocentesSheet(matrix: unknown[][]): TeacherLookup {
  const lookup: TeacherLookup = new Map()

  let headerRow = -1
  let colCourse = -1
  let colCareer = -1
  let colPlan = -1
  let colShift = -1
  let colTeacher = -1

  for (let rowIndex = 0; rowIndex < Math.min(matrix.length, 30); rowIndex += 1) {
    const row = matrix[rowIndex] ?? []
    const course = row.findIndex((cell) => normalizeComparable(cell) === 'asignatura')
    const career = row.findIndex((cell) => normalizeComparable(cell) === 'carrera')
    const teacher = row.findIndex((cell) => normalizeComparable(cell) === 'docente')
    if (course < 0 || career < 0 || teacher < 0) continue

    headerRow = rowIndex
    colCourse = course
    colCareer = career
    colPlan = row.findIndex((cell) => normalizeComparable(cell) === 'plan')
    colShift = row.findIndex((cell) => normalizeComparable(cell) === 'turno')
    colTeacher = teacher
    break
  }

  if (headerRow < 0) {
    return lookup
  }

  for (let rowIndex = headerRow + 1; rowIndex < matrix.length; rowIndex += 1) {
    const row = matrix[rowIndex] ?? []
    const course = normalizeText(row[colCourse]).rawValue.trim()
    const career = normalizeText(row[colCareer]).rawValue.trim()
    const teacher = normalizeText(row[colTeacher]).rawValue.trim()
    if (!course || !career || !teacher) continue

    const plan = colPlan >= 0 ? normalizeText(row[colPlan]).rawValue.trim() : ''
    const shift = colShift >= 0 ? normalizeText(row[colShift]).rawValue.trim() : ''

    const withPlan = teacherKey([career, course, plan, shift])
    const withoutPlan = teacherKey([career, course, shift])
    if (withPlan && !lookup.has(withPlan)) lookup.set(withPlan, teacher)
    if (withoutPlan && !lookup.has(withoutPlan)) lookup.set(withoutPlan, teacher)
  }

  return lookup
}

export function lookupTeacherName(
  lookup: TeacherLookup,
  input: {
    careerCode: string
    courseName: string
    plan?: string | null
    shift?: string | null
  },
): string | null {
  if (lookup.size === 0) return null

  const withPlan = teacherKey([input.careerCode, input.courseName, input.plan, input.shift])
  const withoutPlan = teacherKey([input.careerCode, input.courseName, input.shift])
  return lookup.get(withPlan) ?? lookup.get(withoutPlan) ?? null
}
