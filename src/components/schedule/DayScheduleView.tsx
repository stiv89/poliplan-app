/**
 * DayScheduleView — Vista diaria para móvil
 */
import { AlertTriangle } from 'lucide-react'
import { getCourseColor } from '@/config/constants'
import { ClassBlockPopoverLayer } from '@/components/schedule/ClassBlockPopoverLayer'
import {
  shortCourseLabel,
  type ClassBlockInfo,
} from '@/components/schedule/ClassBlockDetail'
import { useClassBlockPopover } from '@/components/schedule/useClassBlockPopover'
import { formatTimeRange } from '@/utils/times'
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
    <div className="relative space-y-2 px-4 py-3 pb-28">
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
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {dayConflicts.length} conflicto{dayConflicts.length !== 1 ? 's' : ''} hoy
          </p>
        </div>
      )}

      {dayBlocks.map((block) => {
        const course = coursesById.get(block.courseId)
        const color = getCourseColor(block.courseId)
        const label = shortCourseLabel(block.title, course?.code)

        return (
          <button
            key={block.id}
            type="button"
            className={`flex min-h-11 w-full items-start gap-3 rounded-2xl p-3 text-left transition active:scale-[0.99] ${
              block.hasConflict
                ? 'border-2 border-danger/40 bg-danger/5'
                : 'border border-slate-100'
            }`}
            style={
              block.hasConflict
                ? undefined
                : { backgroundColor: color.bg, borderColor: `${color.border}80` }
            }
            onClick={(event) => handleBlockClick(block, event)}
            onMouseEnter={(event) => handleBlockMouseEnter(block, event)}
            onMouseLeave={handleBlockMouseLeave}
          >
            <div className="min-w-[52px] pt-0.5 text-right">
              <p
                className="text-xs font-semibold"
                style={{ color: block.hasConflict ? '#DC2626' : color.text }}
              >
                {block.startTime.slice(0, 5)}
              </p>
              <p
                className="text-[10px] opacity-60"
                style={{ color: block.hasConflict ? '#DC2626' : color.text }}
              >
                {block.endTime.slice(0, 5)}
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{label}</p>
              <p className="text-xs text-muted">Sec. {block.sectionCode}</p>
              {block.classroom && <p className="text-xs text-muted">{block.classroom}</p>}
              {block.hasConflict && (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Conflicto · {formatTimeRange(block.startTime, block.endTime)}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
