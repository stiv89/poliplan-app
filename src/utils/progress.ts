import type {
  AcademicAttempt,
  Curriculum,
  CurriculumCourse,
  ProgressSummary,
  StudentCourseStatus,
} from '@/types/academicHistory'
import {
  calculateGpa,
  deriveCourseStatusFromAttempts,
  getBestGrade,
  isPassingGrade,
} from '@/utils/academicApproval'

export function deriveStudentCourseStatuses(
  curriculum: Curriculum,
  attempts: AcademicAttempt[],
): StudentCourseStatus[] {
  const byCourse = new Map<string, AcademicAttempt[]>()

  for (const attempt of attempts) {
    if (!attempt.matchedCourseId || attempt.status === 'pending_review') continue
    const list = byCourse.get(attempt.matchedCourseId) ?? []
    list.push(attempt)
    byCourse.set(attempt.matchedCourseId, list)
  }

  return curriculum.courses.map((course) => {
    const courseAttempts = byCourse.get(course.id) ?? []
    const status = deriveCourseStatusFromAttempts(courseAttempts)
  return {
      courseId: course.id,
      status,
      bestGrade: getBestGrade(courseAttempts.map((a) => a.finalGrade)),
      latestAttemptId: courseAttempts[courseAttempts.length - 1]?.id ?? null,
      attemptsCount: courseAttempts.length,
    }
  })
}

export function getPassedCourseIds(statuses: StudentCourseStatus[]): Set<string> {
  return new Set(statuses.filter((s) => s.status === 'passed').map((s) => s.courseId))
}

export function getPendingCourses(
  curriculum: Curriculum,
  statuses: StudentCourseStatus[],
): CurriculumCourse[] {
  const passed = getPassedCourseIds(statuses)
  return curriculum.courses.filter((c) => !passed.has(c.id) && c.type !== 'extension')
}

export function isSemesterComplete(
  semesterNumber: number,
  curriculum: Curriculum,
  statuses: StudentCourseStatus[],
): boolean {
  const passed = getPassedCourseIds(statuses)
  const semesterCourses = curriculum.courses.filter(
    (c) => c.semesterNumber === semesterNumber && c.type !== 'extension',
  )
  if (semesterCourses.length === 0) return false
  return semesterCourses.every((c) => passed.has(c.id))
}

export function calculateProgressSummary(
  profile: { careerName: string; importedGpa?: number | null },
  curriculum: Curriculum,
  attempts: AcademicAttempt[],
): ProgressSummary {
  const statuses = deriveStudentCourseStatuses(curriculum, attempts)
  const passed = getPassedCourseIds(statuses)
  const requiredCourses = curriculum.courses.filter((c) => c.type !== 'extension')
  const passedCourses = requiredCourses.filter((c) => passed.has(c.id))

  const earnedCredits = passedCourses.reduce((sum, course) => sum + (course.credits ?? 0), 0)
  const totalCredits =
    curriculum.totalCredits ??
    requiredCourses.reduce((sum, course) => sum + (course.credits ?? 0), 0)

  const semesterNumbers = [
    ...new Set(requiredCourses.map((c) => c.semesterNumber).filter((n) => n > 0)),
  ].sort((a, b) => a - b)

  const completedSemesters = semesterNumbers.filter((n) =>
    isSemesterComplete(n, curriculum, statuses),
  ).length

  const passingGrades = attempts
    .filter((a) => a.matchedCourseId && isPassingGrade(a.finalGrade))
    .map((a) => a.finalGrade!)
  const computedGpa = calculateGpa(passingGrades)
  const gpa = profile.importedGpa ?? computedGpa

  const extensionCourse = curriculum.courses.find((c) => c.type === 'extension')
  let extensionStatus: ProgressSummary['extensionStatus'] = 'not_registered'
  if (extensionCourse) {
    const extStatus = statuses.find((s) => s.courseId === extensionCourse.id)
    extensionStatus = extStatus?.status === 'passed' ? 'complete' : 'incomplete'
  }

  return {
    careerName: profile.careerName,
    curriculumName: curriculum.name,
    passedCourses: passedCourses.length,
    totalCourses: requiredCourses.length,
    coursePercent:
      requiredCourses.length > 0
        ? Math.round((passedCourses.length / requiredCourses.length) * 100)
        : 0,
    earnedCredits,
    totalCredits,
    creditPercent:
      totalCredits > 0 ? Math.round((earnedCredits / totalCredits) * 100) : 0,
    gpa,
    completedSemesters,
    totalSemesters: semesterNumbers.length,
    extensionStatus,
  }
}

export function groupAttemptsByCourse(
  curriculum: Curriculum,
  attempts: AcademicAttempt[],
): Map<string, { course: CurriculumCourse; attempts: AcademicAttempt[] }> {
  const map = new Map<string, { course: CurriculumCourse; attempts: AcademicAttempt[] }>()
  const courseById = new Map(curriculum.courses.map((c) => [c.id, c]))

  for (const attempt of attempts) {
    if (!attempt.matchedCourseId) continue
    const course = courseById.get(attempt.matchedCourseId)
    if (!course) continue
    const entry = map.get(course.id) ?? { course, attempts: [] }
    entry.attempts.push(attempt)
    map.set(course.id, entry)
  }

  for (const entry of map.values()) {
    entry.attempts.sort((a, b) => {
      const da = a.examDate ?? a.createdAt
      const db = b.examDate ?? b.createdAt
      return da.localeCompare(db)
    })
  }

  return map
}
