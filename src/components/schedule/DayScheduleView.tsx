/**
 * DayScheduleView — Vista diaria para móvil (lista estilo iOS)
 */
import { getCourseInitial, getCourseListAccent } from '@/config/constants'
import { ClassBlockPopoverLayer } from '@/components/schedule/ClassBlockPopoverLayer'
import { ScheduleConflictNote } from '@/components/schedule/ScheduleConflictNote'
import type { ClassBlockInfo } from '@/components/schedule/ClassBlockDetail'
import { useClassBlockPopover } from '@/components/schedule/useClassBlockPopover'
import { formatTimeRangeEs } from '@/utils/times'
import { getMeetingConflictDetails } from '@/utils/conflicts'
import type { CourseSection, ScheduleConflict } from '@/types/academic'
import { getSectionScheduleTitle } from '@/utils/electiveCourses'

interface DayScheduleViewProps {
  day: number
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  coursesById: Map<string, { name: string; code: string | null }>
  onRemoveSection: (sectionId: string) => void
  onViewAlternatives?: (courseId: string) => void
  removingId: string | null
}

export function DayScheduleView({
  day,
  selectedSections,
  conflicts,
  coursesById,
  onRemoveSection,
  onViewAlternatives,
  removingId,
}: DayScheduleViewProps) {
  const {
    activeBlock,
    anchorRef,
    popoverRef,
    handleBlockClick,
    handleBlockMouseEnter,
    handleBlockMouseLeave,
    handlePopoverMouseEnter,
    handlePopoverMouseLeave,
    close: closePopover,
  } = useClassBlockPopover()

  const sectionsById = new Map(selectedSections.map((s) => [s.id, s]))

  const dayBlocks: ClassBlockInfo[] = selectedSections
    .flatMap((section) => {
      const course = coursesById.get(section.courseId)
      return section.meetings
        .filter((m) => m.dayOfWeek === day)
        .map((meeting) => {
          const conflictDetails = getMeetingConflictDetails(
            section.id,
            meeting.dayOfWeek,
            meeting.startTime,
            meeting.endTime,
            conflicts,
          )
          return {
            id: meeting.id,
            sectionId: section.id,
            courseId: section.courseId,
            dayOfWeek: meeting.dayOfWeek,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            title: getSectionScheduleTitle(section, course),
            sectionCode: section.sectionCode,
            classroom: meeting.classroom,
            teacherName: section.teacherName,
            teacherEmail: section.teacherEmail,
            teacherId: section.teacherId,
            academicPeriodId: section.academicPeriodId,
            hasConflict: conflictDetails.length > 0,
            conflictDetails,
          }
        })
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const dayConflicts = conflicts.filter((c) => c.dayOfWeek === day)
  const conflictCourseIds = new Set<string>()
  for (const conflict of dayConflicts) {
    const first = sectionsById.get(conflict.firstSectionId)
    const second = sectionsById.get(conflict.secondSectionId)
    if (first) conflictCourseIds.add(first.courseId)
    if (second) conflictCourseIds.add(second.courseId)
  }

  if (dayBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted">No tenés clases este día</p>
      </div>
    )
  }

  return (
    <div className="relative pb-28">
      <ClassBlockPopoverLayer
        activeBlock={activeBlock}
        anchorRef={anchorRef}
        popoverRef={popoverRef}
        sectionsById={sectionsById}
        coursesById={coursesById}
        removingId={removingId}
        onClose={closePopover}
        onRemove={(id) => {
          onRemoveSection(id)
          closePopover()
        }}
        onViewAlternatives={
          onViewAlternatives
            ? (courseId) => {
                closePopover()
                onViewAlternatives(courseId)
              }
            : undefined
        }
        onPopoverMouseEnter={handlePopoverMouseEnter}
        onPopoverMouseLeave={handlePopoverMouseLeave}
      />

      {conflictCourseIds.size >= 2 && (
        <div className="schedule-conflict-banner mx-5 my-3" role="status">
          <span className="schedule-conflict-banner-text">
            <span aria-hidden="true">⚠️ </span>
            {conflictCourseIds.size} materias tienen un conflicto horario
          </span>
        </div>
      )}

      <div className="day-schedule-list">
        {dayBlocks.map((block, index) => {
          const course = coursesById.get(block.courseId)
          const displayName = course?.name ?? block.title
          const accent = getCourseListAccent(block.courseId)
          const initial = getCourseInitial(displayName, course?.code)
          const metaParts = [formatTimeRangeEs(block.startTime, block.endTime)]
          if (block.classroom) {
            metaParts.push(block.classroom)
          }
          const overlapCourseName = block.conflictDetails[0]
            ? coursesById.get(
                sectionsById.get(block.conflictDetails[0].otherSectionId)?.courseId ?? '',
              )?.name
            : null
          const overlapNote = overlapCourseName
            ? `Se superpone con ${overlapCourseName}`
            : block.hasConflict
              ? 'Conflicto de horario'
              : null

          return (
            <button
              key={block.id}
              type="button"
              className={`day-schedule-row ${index === dayBlocks.length - 1 ? 'day-schedule-row--last' : ''} ${
                block.hasConflict ? 'day-schedule-row--conflict' : ''
              }`}
              onClick={(event) => handleBlockClick(block, event)}
              onMouseEnter={(event) => handleBlockMouseEnter(block, event)}
              onMouseLeave={handleBlockMouseLeave}
            >
              <span
                className="day-schedule-avatar"
                style={{ backgroundColor: accent }}
                aria-hidden="true"
              >
                {initial}
              </span>

              <span className="day-schedule-copy">
                <span className="day-schedule-title" style={{ color: accent }}>
                  {displayName}
                </span>
                {block.teacherName && (
                  <span className="day-schedule-meta">{block.teacherName}</span>
                )}
                <span className="day-schedule-meta">{metaParts.join(' · ')}</span>
                {overlapNote && <ScheduleConflictNote message={overlapNote} className="mt-0.5" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
