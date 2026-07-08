import type { CourseSection, ScheduleConflict } from '@/types/academic'
import {
  classifyOverlap,
  doTimesOverlap,
  getOverlapRange,
} from '@/utils/times'

interface MeetingRef {
  sectionId: string
  meetingId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

function flattenMeetings(sections: CourseSection[]): MeetingRef[] {
  return sections.flatMap((section) =>
    section.meetings.map((meeting) => ({
      sectionId: section.id,
      meetingId: meeting.id,
      dayOfWeek: meeting.dayOfWeek,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
    })),
  )
}

function buildConflictId(
  firstSectionId: string,
  secondSectionId: string,
  dayOfWeek: number,
  overlapStart: string,
  overlapEnd: string,
): string {
  const ordered = [firstSectionId, secondSectionId].sort().join(':')
  return `${ordered}:${dayOfWeek}:${overlapStart}-${overlapEnd}`
}

export function detectScheduleConflicts(
  sections: CourseSection[],
): ScheduleConflict[] {
  const meetings = flattenMeetings(sections)
  const conflicts: ScheduleConflict[] = []
  const seen = new Set<string>()

  for (let i = 0; i < meetings.length; i += 1) {
    for (let j = i + 1; j < meetings.length; j += 1) {
      const first = meetings[i]
      const second = meetings[j]

      if (!first || !second) {
        continue
      }

      if (first.dayOfWeek !== second.dayOfWeek) {
        continue
      }

      if (
        !doTimesOverlap(
          first.startTime,
          first.endTime,
          second.startTime,
          second.endTime,
        )
      ) {
        continue
      }

      const sameSection = first.sectionId === second.sectionId
      const type = classifyOverlap(
        first.startTime,
        first.endTime,
        second.startTime,
        second.endTime,
        sameSection,
      )
      const { overlapStart, overlapEnd } = getOverlapRange(
        first.startTime,
        first.endTime,
        second.startTime,
        second.endTime,
      )

      const id = buildConflictId(
        first.sectionId,
        second.sectionId,
        first.dayOfWeek,
        overlapStart,
        overlapEnd,
      )

      if (seen.has(id)) {
        continue
      }

      seen.add(id)
      conflicts.push({
        id,
        firstSectionId: first.sectionId,
        secondSectionId: second.sectionId,
        dayOfWeek: first.dayOfWeek,
        overlapStart,
        overlapEnd,
        type,
      })
    }
  }

  return conflicts.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek
    }
    return a.overlapStart.localeCompare(b.overlapStart)
  })
}

export function getConflictsForSection(
  sectionId: string,
  conflicts: ScheduleConflict[],
): ScheduleConflict[] {
  return conflicts.filter(
    (conflict) =>
      conflict.firstSectionId === sectionId ||
      conflict.secondSectionId === sectionId,
  )
}
