/**
 * DayScheduleView — Vista diaria para móvil (lista estilo iOS)
 */
import { AlertTriangle } from 'lucide-react'
import { getCourseInitial, getCourseListAccent } from '@/config/constants'
import { ClassBlockPopoverLayer } from '@/components/schedule/ClassBlockPopoverLayer'
import type { ClassBlockInfo } from '@/components/schedule/ClassBlockDetail'
import { useClassBlockPopover } from '@/components/schedule/useClassBlockPopover'
import { formatTimeRange, formatTimeRangeEs } from '@/utils/times'
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

  if (dayBlocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted">No tenés clases este día</p>
      </div>
    )
  }

  return (
    <div className="relative pb-28 pt-1">
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

      {dayConflicts.length > 0 && (
        <div className="mx-6 mb-3 rounded-xl border border-red-100/90 bg-red-50/40 px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {dayConflicts.length} conflicto{dayConflicts.length !== 1 ? 's' : ''} hoy
          </p>
        </div>
      )}

      <div className="day-schedule-list">
        {dayBlocks.map((block, index) => {
          const course = coursesById.get(block.courseId)
          const displayName = course?.name ?? block.title
          const accent = block.hasConflict ? '#DC2626' : getCourseListAccent(block.courseId)
          const initial = getCourseInitial(displayName, course?.code)
          const metaParts = [formatTimeRangeEs(block.startTime, block.endTime)]
          if (!block.hasConflict && block.classroom) {
            metaParts.push(block.classroom)
          }

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
                {block.hasConflict ? (
                  <AlertTriangle className="h-4 w-4 text-white" strokeWidth={2.25} />
                ) : (
                  initial
                )}
              </span>

              <span className="day-schedule-copy">
                <span className="day-schedule-title" style={{ color: accent }}>
                  {displayName}
                </span>
                <span className="day-schedule-meta">
                  {block.hasConflict ? (
                    <>
                      <span className="font-medium text-red-600">Conflicto · </span>
                      {formatTimeRange(block.startTime, block.endTime)}
                    </>
                  ) : (
                    metaParts.join(' · ')
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
