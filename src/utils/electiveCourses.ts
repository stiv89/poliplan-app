import type { Course, CourseSection } from '@/types/academic'
import { getCourseFootnote } from '@/utils/courseFootnotes'
import type { SectionCourseInfo } from '@/utils/sectionDisplay'

const ELECTIVE_PAREN = /^(electiva|optativa)\s*(\d+)\s*\(\s*(.+?)\s*\)$/i
const ELECTIVE_DASH = /^(electiva|optativa)\s*(\d+)\s*-\s*(.+)$/i
const ELECTIVE_SLOT_ONLY = /^(electiva|optativa)\s*(\d+)\s*$/i

function formatElectiveSlot(kind: string, number: string): string {
  const label = kind.toLowerCase() === 'optativa' ? 'Optativa' : 'Electiva'
  return `${label} ${number}`
}

/** Parsea nombres de electivas/optativas del Excel o historial académico. */
export function parseElectiveCourseName(name: string): {
  slot: string | null
  specificName: string | null
} {
  const trimmed = name.trim()
  if (!trimmed) return { slot: null, specificName: null }

  const { displayName } = getCourseFootnote(trimmed)

  const parenMatch = displayName.match(ELECTIVE_PAREN)
  if (parenMatch) {
    return {
      slot: formatElectiveSlot(parenMatch[1]!, parenMatch[2]!),
      specificName: parenMatch[3]!.trim() || null,
    }
  }

  const dashMatch = displayName.match(ELECTIVE_DASH)
  if (dashMatch) {
    return {
      slot: formatElectiveSlot(dashMatch[1]!, dashMatch[2]!),
      specificName: dashMatch[3]!.trim() || null,
    }
  }

  const slotOnly = displayName.match(ELECTIVE_SLOT_ONLY)
  if (slotOnly) {
    return {
      slot: formatElectiveSlot(slotOnly[1]!, slotOnly[2]!),
      specificName: null,
    }
  }

  return { slot: null, specificName: null }
}

export function isElectiveSlotCourseName(name: string): boolean {
  return parseElectiveCourseName(name).slot != null
}

export function resolveSectionElectiveName(
  section: Pick<CourseSection, 'specificElectiveName' | 'sectionCode'>,
  course?: Pick<Course, 'name'> | Pick<SectionCourseInfo, 'name'> | null,
): string | null {
  if (section.specificElectiveName?.trim()) {
    return getCourseFootnote(section.specificElectiveName).displayName
  }

  if (!course?.name) return null

  const parsed = parseElectiveCourseName(course.name)
  return parsed.specificName ? getCourseFootnote(parsed.specificName).displayName : null
}

export function resolveCourseSlotName(
  course?: Pick<Course, 'name'> | Pick<SectionCourseInfo, 'name'> | null,
): string | null {
  if (!course?.name) return null
  const parsed = parseElectiveCourseName(course.name)
  if (parsed.slot && parsed.specificName) return parsed.slot
  if (parsed.slot && !parsed.specificName) return parsed.slot
  return null
}

export function getCourseGroupingKey(
  courseId: string,
  course?: SectionCourseInfo | null,
): string {
  const slot = resolveCourseSlotName(course)
  if (slot && course?.careerId) {
    return `elective:${course.careerId}:${slot.toLowerCase()}`
  }
  return courseId
}

export function getSectionScheduleTitle(
  section: Pick<CourseSection, 'specificElectiveName' | 'sectionCode'>,
  course?: Pick<Course, 'name'> | Pick<SectionCourseInfo, 'name'> | null,
): string {
  const specific = resolveSectionElectiveName(section, course)
  if (specific) return specific
  return getCourseFootnote(course?.name ?? 'Materia').displayName
}

export function getSectionSearchLabel(
  section: Pick<CourseSection, 'specificElectiveName' | 'sectionCode' | 'teacherName'>,
  course?: { name: string; code?: string | null } | null,
): string {
  const slot = resolveCourseSlotName(course) ?? course?.name ?? ''
  const specific = resolveSectionElectiveName(section, course)
  return [slot, specific, course?.code ?? '', section.sectionCode, section.teacherName ?? '']
    .filter(Boolean)
    .join(' ')
}
