import type { ClassMeeting, CourseSection, ScheduleConflict } from '@/types/academic'
import { getCourseFootnote, type CourseFootnoteKind } from '@/utils/courseFootnotes'
import {
  getCourseGroupingKey,
  resolveCourseSlotName,
  resolveSectionElectiveName,
} from '@/utils/electiveCourses'
import { formatTimeRange } from '@/utils/times'
import { getConflictsForSection, getPreviewConflicts } from '@/utils/conflicts'

const DAY_ABBR = ['', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'] as const

export interface SectionCourseInfo {
  name: string
  code: string | null
  level: number | null
  semester: number | null
  careerId?: string
}

export function getCourseSemesterNumber(
  course: Pick<SectionCourseInfo, 'semester' | 'level'>,
): number | null {
  return course.semester ?? course.level ?? null
}

export function getCourseInitial(name: string, code: string | null): string {
  if (code?.trim()) return code.trim().charAt(0).toUpperCase()
  return name.trim().charAt(0).toUpperCase() || '?'
}

export interface CourseSectionGroup {
  groupKey: string
  courseId: string
  courseName: string
  courseDisplayName: string
  courseFootnote: CourseFootnoteKind | null
  courseCode: string | null
  courseSemester: number | null
  sections: CourseSection[]
}

export function groupSectionsByCourse(
  sections: CourseSection[],
  coursesById: Map<string, SectionCourseInfo>,
  options?: { preserveOrder?: boolean },
): CourseSectionGroup[] {
  const map = new Map<string, CourseSectionGroup>()
  const groupOrder = new Map<string, number>()

  for (const [index, section] of sections.entries()) {
    const course = coursesById.get(section.courseId)
    const groupKey = getCourseGroupingKey(section.courseId, course)
    if (options?.preserveOrder && !groupOrder.has(groupKey)) {
      groupOrder.set(groupKey, index)
    }
    let group = map.get(groupKey)
    if (!group) {
      const slotName = resolveCourseSlotName(course)
      const baseName = slotName ?? course?.name ?? 'Materia'
      const footnote = getCourseFootnote(baseName)
      group = {
        groupKey,
        courseId: section.courseId,
        courseName: footnote.displayName,
        courseDisplayName: footnote.displayName,
        courseFootnote: footnote.kind,
        courseCode: course?.code ?? null,
        courseSemester: course ? getCourseSemesterNumber(course) : null,
        sections: [],
      }
      map.set(groupKey, group)
    }
    group.sections.push(section)
  }

  for (const group of map.values()) {
    group.sections.sort((a, b) => {
      const aName = resolveSectionElectiveName(a, coursesById.get(a.courseId)) ?? a.sectionCode
      const bName = resolveSectionElectiveName(b, coursesById.get(b.courseId)) ?? b.sectionCode
      return aName.localeCompare(bName) || a.sectionCode.localeCompare(b.sectionCode)
    })
  }

  return [...map.values()].sort((a, b) => {
    if (options?.preserveOrder) {
      const aOrder = groupOrder.get(a.groupKey) ?? Number.MAX_SAFE_INTEGER
      const bOrder = groupOrder.get(b.groupKey) ?? Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return aOrder - bOrder
    }

    return (
      a.courseName.localeCompare(b.courseName) ||
      (a.courseCode ?? '').localeCompare(b.courseCode ?? '')
    )
  })
}

export function formatScheduleCompact(
  meetings: ClassMeeting[],
  options?: { isFinalExamOnly?: boolean },
): string {
  if (meetings.length === 0) {
    return options?.isFinalExamOnly ? 'Sin clases' : 'Horario por confirmar'
  }

  const groups = new Map<string, number[]>()
  for (const meeting of meetings) {
    const key = `${meeting.startTime.slice(0, 5)}-${meeting.endTime.slice(0, 5)}`
    const days = groups.get(key) ?? []
    days.push(meeting.dayOfWeek)
    groups.set(key, days)
  }

  return [...groups.entries()]
    .map(([timeKey, days]) => {
      const dayStr = [...new Set(days)]
        .sort((a, b) => a - b)
        .map((day) => DAY_ABBR[day] ?? '')
        .join('/')
      const [start, end] = timeKey.split('-')
      return `${dayStr} ${formatTimeRange(start!, end!)}`
    })
    .join(' · ')
}

export function getSectionConflictMessages(
  section: CourseSection,
  selected: boolean,
  selectedSections: CourseSection[],
  conflicts: ScheduleConflict[],
  coursesById: Map<string, { name: string }>,
  allSectionsById: Map<string, CourseSection>,
): string[] {
  const relevant = selected
    ? getConflictsForSection(section.id, conflicts)
    : getPreviewConflicts(section, selectedSections)

  const messages = new Set<string>()
  for (const conflict of relevant) {
    const otherId =
      conflict.firstSectionId === section.id
        ? conflict.secondSectionId
        : conflict.firstSectionId
    const otherSection = allSectionsById.get(otherId)
    const course = otherSection ? coursesById.get(otherSection.courseId) : null
    messages.add(
      conflict.type === 'exam'
        ? course
          ? `Examen el mismo día / horario que ${course.name}`
          : 'Conflicto de examen'
        : course
          ? `Se superpone con ${course.name}`
          : 'Conflicto de horario',
    )
  }
  return [...messages]
}

/** Course IDs connected to `courseId` through schedule conflicts among selected sections. */
export function getConflictClusterCourseIds(
  courseId: string,
  selectedSections: CourseSection[],
  conflicts: ScheduleConflict[],
): Set<string> {
  const sectionById = new Map(selectedSections.map((section) => [section.id, section]))
  const edges = new Map<string, Set<string>>()

  for (const conflict of conflicts) {
    const first = sectionById.get(conflict.firstSectionId)
    const second = sectionById.get(conflict.secondSectionId)
    if (!first || !second || first.courseId === second.courseId) continue

    if (!edges.has(first.courseId)) edges.set(first.courseId, new Set())
    if (!edges.has(second.courseId)) edges.set(second.courseId, new Set())
    edges.get(first.courseId)!.add(second.courseId)
    edges.get(second.courseId)!.add(first.courseId)
  }

  const visited = new Set<string>()
  const stack = [courseId]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (visited.has(current)) continue
    visited.add(current)
    for (const neighbor of edges.get(current) ?? []) {
      if (!visited.has(neighbor)) stack.push(neighbor)
    }
  }

  return visited
}

export function findCrossCourseConflictPreview(
  courseId: string,
  selectedSections: CourseSection[],
  conflicts: ScheduleConflict[],
): CourseSection | null {
  const sectionById = new Map(selectedSections.map((section) => [section.id, section]))

  for (const conflict of conflicts) {
    const first = sectionById.get(conflict.firstSectionId)
    const second = sectionById.get(conflict.secondSectionId)
    if (first?.courseId === courseId && second && second.courseId !== courseId) return second
    if (second?.courseId === courseId && first && first.courseId !== courseId) return first
  }

  return null
}

export function sectionHasConflicts(
  section: CourseSection,
  selected: boolean,
  selectedSections: CourseSection[],
  conflicts: ScheduleConflict[],
  coursesById: Map<string, { name: string }>,
  allSectionsById: Map<string, CourseSection>,
): boolean {
  return (
    getSectionConflictMessages(
      section,
      selected,
      selectedSections,
      conflicts,
      coursesById,
      allSectionsById,
    ).length > 0
  )
}
