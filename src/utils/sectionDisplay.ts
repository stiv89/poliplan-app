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
): CourseSectionGroup[] {
  const map = new Map<string, CourseSectionGroup>()

  for (const section of sections) {
    const course = coursesById.get(section.courseId)
    const groupKey = getCourseGroupingKey(section.courseId, course)
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

  return [...map.values()].sort(
    (a, b) =>
      a.courseName.localeCompare(b.courseName) ||
      (a.courseCode ?? '').localeCompare(b.courseCode ?? ''),
  )
}

export function formatScheduleCompact(
  meetings: ClassMeeting[],
  options?: { isFinalExamOnly?: boolean },
): string {
  if (meetings.length === 0) {
    return options?.isFinalExamOnly
      ? 'Sin clases · solo examen final'
      : 'Horario por confirmar'
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
    messages.add(course ? `Conflicto con ${course.name}` : 'Conflicto de horario')
  }
  return [...messages]
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
