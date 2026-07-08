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

export interface MeetingConflictDetail {
  overlapStart: string
  overlapEnd: string
  otherSectionId: string
}

/** Conflictos que aplican a una reunión concreta (mismo día + superposición horaria). */
export function getMeetingConflictDetails(
  sectionId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  conflicts: ScheduleConflict[],
): MeetingConflictDetail[] {
  const byOtherSection = new Map<string, MeetingConflictDetail>()

  for (const conflict of conflicts) {
    if (conflict.dayOfWeek !== dayOfWeek) continue

    const otherSectionId =
      conflict.firstSectionId === sectionId
        ? conflict.secondSectionId
        : conflict.secondSectionId === sectionId
          ? conflict.firstSectionId
          : null

    if (!otherSectionId || otherSectionId === sectionId) continue

    if (
      !doTimesOverlap(
        startTime,
        endTime,
        conflict.overlapStart,
        conflict.overlapEnd,
      )
    ) {
      continue
    }

    const existing = byOtherSection.get(otherSectionId)
    if (!existing) {
      byOtherSection.set(otherSectionId, {
        overlapStart: conflict.overlapStart,
        overlapEnd: conflict.overlapEnd,
        otherSectionId,
      })
      continue
    }

    byOtherSection.set(otherSectionId, {
      otherSectionId,
      overlapStart:
        conflict.overlapStart < existing.overlapStart
          ? conflict.overlapStart
          : existing.overlapStart,
      overlapEnd:
        conflict.overlapEnd > existing.overlapEnd
          ? conflict.overlapEnd
          : existing.overlapEnd,
    })
  }

  return [...byOtherSection.values()]
}

export function sectionsHaveTimeOverlap(
  first: CourseSection,
  second: CourseSection,
): boolean {
  for (const meetingA of first.meetings) {
    for (const meetingB of second.meetings) {
      if (meetingA.dayOfWeek !== meetingB.dayOfWeek) continue
      if (
        doTimesOverlap(
          meetingA.startTime,
          meetingA.endTime,
          meetingB.startTime,
          meetingB.endTime,
        )
      ) {
        return true
      }
    }
  }
  return false
}

export function getPreviewConflicts(
  previewSection: CourseSection,
  selectedSections: CourseSection[],
): ScheduleConflict[] {
  if (selectedSections.length === 0) return []
  return detectScheduleConflicts([previewSection, ...selectedSections]).filter(
    (conflict) =>
      conflict.firstSectionId === previewSection.id ||
      conflict.secondSectionId === previewSection.id,
  )
}

export function meetingOverlapsPreview(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  previewSection: CourseSection,
): boolean {
  for (const meeting of previewSection.meetings) {
    if (meeting.dayOfWeek !== dayOfWeek) continue
    if (doTimesOverlap(startTime, endTime, meeting.startTime, meeting.endTime)) {
      return true
    }
  }
  return false
}
