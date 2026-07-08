/** Reglas de aprobación configurables — no acoplar a componentes UI. */

export interface ApprovalRules {
  passingGrades: number[]
  failingGrades: number[]
}

export const DEFAULT_APPROVAL_RULES: ApprovalRules = {
  passingGrades: [2, 3, 4, 5],
  failingGrades: [1],
}

export function isPassingGrade(
  grade: number | null | undefined,
  rules: ApprovalRules = DEFAULT_APPROVAL_RULES,
): boolean {
  if (grade == null || Number.isNaN(grade)) return false
  return rules.passingGrades.includes(grade)
}

export function isFailingGrade(
  grade: number | null | undefined,
  rules: ApprovalRules = DEFAULT_APPROVAL_RULES,
): boolean {
  if (grade == null || Number.isNaN(grade)) return false
  return rules.failingGrades.includes(grade)
}

export function deriveAttemptStatus(
  grade: number | null | undefined,
  rules: ApprovalRules = DEFAULT_APPROVAL_RULES,
): 'passed' | 'failed' | 'pending_review' {
  if (grade == null) return 'pending_review'
  if (isPassingGrade(grade, rules)) return 'passed'
  if (isFailingGrade(grade, rules)) return 'failed'
  return 'pending_review'
}

export function deriveCourseStatusFromAttempts(
  attempts: Array<{ status: string; finalGrade?: number | null }>,
): 'passed' | 'failed' | 'in_progress' | 'not_taken' {
  if (attempts.length === 0) return 'not_taken'

  const hasPassed = attempts.some((a) => a.status === 'passed')
  if (hasPassed) return 'passed'

  const hasInProgress = attempts.some((a) => a.status === 'in_progress')
  if (hasInProgress) return 'in_progress'

  const hasFailed = attempts.some((a) => a.status === 'failed')
  if (hasFailed) return 'failed'

  return 'not_taken'
}

export function getBestGrade(grades: Array<number | null | undefined>): number | null {
  const valid = grades.filter((g): g is number => g != null && !Number.isNaN(g))
  if (valid.length === 0) return null
  return Math.max(...valid)
}

export function calculateGpa(grades: number[]): number | null {
  if (grades.length === 0) return null
  const sum = grades.reduce((acc, g) => acc + g, 0)
  return Math.round((sum / grades.length) * 100) / 100
}
