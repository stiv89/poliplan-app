import type { ClassMeeting, CourseSection, ScheduleConflict } from '@/types/academic'
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

export function formatScheduleCompact(meetings: ClassMeeting[]): string {
  if (meetings.length === 0) return 'Horario por confirmar'

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
