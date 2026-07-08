import type { Curriculum, StudentCourseStatus } from '@/types/academicHistory'
import { normalizeCourseName } from '@/utils/courseMatching'

/** Etiqueta no bloqueante para mostrar en secciones según historial académico. */
export function getCourseProgressLabel(
  courseName: string,
  curriculum: Curriculum | null,
  statuses: StudentCourseStatus[],
): string | null {
  if (!curriculum) return null

  const normalized = normalizeCourseName(courseName)
  const course = curriculum.courses.find((c) => normalizeCourseName(c.name) === normalized)
  if (!course) return null

  const status = statuses.find((s) => s.courseId === course.id)
  if (status?.status === 'passed') return 'Aprobada anteriormente'
  return 'Pendiente en tu plan'
}
