/**
 * WeeklyScheduleGrid — Calendario semanal protagonista
 */
import { useEffect, useMemo, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { DAYS_OF_WEEK, getCourseColor } from '@/config/constants'
import { DEFAULT_SCHEDULE_VIEW_FILTERS } from '@/types/scheduleFilters'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import { formatTimeRange, timeToMinutes } from '@/utils/times'
import { meetingMatchesViewFilters } from '@/utils/scheduleFilters'
import {
  getMeetingConflictDetails,
  getPreviewConflicts,
  meetingOverlapsPreview,
} from '@/utils/conflicts'
import { ClassBlockPopoverLayer } from '@/components/schedule/ClassBlockPopoverLayer'
import {
  shortCourseLabel,
  type ClassBlockInfo,
} from '@/components/schedule/ClassBlockDetail'
import { useClassBlockPopover } from '@/components/schedule/useClassBlockPopover'
import { getSectionScheduleTitle } from '@/utils/electiveCourses'
import type { CourseSection, ScheduleConflict } from '@/types/academic'

const HOUR_HEIGHT = 56

interface WeeklyScheduleGridProps {
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  coursesById: Map<string, { name: string; code: string | null }>
  onRemoveSection: (sectionId: string) => void
  onViewAlternatives?: (courseId: string) => void
  removingId: string | null
  previewSection?: CourseSection | null
  viewFilters?: ScheduleViewFilters
}

export function WeeklyScheduleGrid({
  selectedSections,
  conflicts,
  coursesById,
  onRemoveSection,
  onViewAlternatives,
  removingId,
  previewSection = null,
  viewFilters = DEFAULT_SCHEDULE_VIEW_FILTERS,
}: WeeklyScheduleGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastScrolledPreviewId = useRef<string | null>(null)
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

  const visibleDays = useMemo(
    () => DAYS_OF_WEEK.filter((day) => viewFilters.days.includes(day.value)),
    [viewFilters.days],
  )

  const startHour = Math.floor(viewFilters.timeStartMinutes / 60)
  const endHour = Math.ceil(viewFilters.timeEndMinutes / 60)
  const hourSlots = Array.from(
    { length: Math.max(1, endHour - startHour + 1) },
    (_, index) => startHour + index,
  )
  const totalMinutes = (endHour - startHour) * 60
  const gridHeight = totalMinutes * (HOUR_HEIGHT / 60)
  const columnTemplate = `48px repeat(${Math.max(visibleDays.length, 1)}, minmax(0, 1fr))`

  const isPreviewActive = Boolean(previewSection)

  const previewConflicts = useMemo(
    () =>
      previewSection ? getPreviewConflicts(previewSection, selectedSections) : [],
    [previewSection, selectedSections],
  )

  const previewConflictSectionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const conflict of previewConflicts) {
      if (previewSection && conflict.firstSectionId === previewSection.id) {
        ids.add(conflict.secondSectionId)
      } else if (previewSection) {
        ids.add(conflict.firstSectionId)
      }
    }
    return ids
  }, [previewConflicts, previewSection])

  const hasPreviewConflict = previewConflicts.length > 0

  const sectionsById = new Map(selectedSections.map((s) => [s.id, s]))

  const blocks: ClassBlockInfo[] = selectedSections.flatMap((section) => {
    const course = coursesById.get(section.courseId)
    return section.meetings
      .filter((meeting) =>
        meetingMatchesViewFilters(
          meeting.dayOfWeek,
          meeting.startTime,
          meeting.endTime,
          viewFilters,
        ),
      )
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

  const previewBlocks = useMemo(
    () =>
      previewSection?.meetings
        .filter((meeting) =>
          meetingMatchesViewFilters(
            meeting.dayOfWeek,
            meeting.startTime,
            meeting.endTime,
            viewFilters,
          ),
        )
        .map((meeting) => ({
          meeting,
          course: coursesById.get(previewSection.courseId),
        })) ?? [],
    [previewSection, coursesById, viewFilters],
  )

  useEffect(() => {
    if (!previewSection || previewBlocks.length === 0) {
      lastScrolledPreviewId.current = null
      return
    }

    if (lastScrolledPreviewId.current === previewSection.id) return
    lastScrolledPreviewId.current = previewSection.id

    const container = scrollRef.current
    if (!container) return

    const tops = previewBlocks.map(({ meeting }) => {
      const startMin = timeToMinutes(meeting.startTime) - startHour * 60
      return (startMin / 60) * HOUR_HEIGHT
    })
    const bottoms = previewBlocks.map(({ meeting }) => {
      const endMin = timeToMinutes(meeting.endTime) - startHour * 60
      return (endMin / 60) * HOUR_HEIGHT
    })

    const minTop = Math.min(...tops)
    const maxBottom = Math.max(...bottoms)
    const previewCenter = (minTop + maxBottom) / 2
    const targetScroll = previewCenter - container.clientHeight / 2

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth',
    })
  }, [previewSection, previewBlocks, startHour])

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-50/45">
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

      <div
        className={`grid shrink-0 border-b border-slate-200/50 bg-slate-50/30 transition-opacity duration-300 ${
          isPreviewActive ? 'opacity-60' : 'opacity-100'
        }`}
        style={{ gridTemplateColumns: columnTemplate }}
      >
        <div />
        {visibleDays.map((day) => (
          <div
            key={day.value}
            className="border-l border-slate-100/50 px-1 py-2 text-center text-[10px] font-normal tracking-wide text-slate-400 first:border-l-0"
          >
            {day.label.slice(0, 3)}
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        {visibleDays.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">
            Elegí al menos un día en los filtros.
          </div>
        ) : (
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: columnTemplate,
              height: gridHeight,
            }}
          >
            <div className="relative">
              {hourSlots.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start justify-end pr-1.5"
                  style={{ top: (hour - startHour) * HOUR_HEIGHT - 7, height: HOUR_HEIGHT }}
                >
                  <span className="text-[10px] font-normal tabular-nums text-slate-400/80">{hour}:00</span>
                </div>
              ))}
            </div>

            {visibleDays.map((day) => {
              const dayBlocks = blocks.filter((block) => block.dayOfWeek === day.value)

              return (
                <div key={day.value} className="relative border-l border-slate-100/50">
                  {hourSlots.map((hour) => (
                    <div
                      key={hour}
                      className="absolute inset-x-0 border-t border-slate-100/45"
                      style={{ top: (hour - startHour) * HOUR_HEIGHT }}
                    />
                  ))}

                  {dayBlocks.map((block) => {
                    const course = coursesById.get(block.courseId)
                    const startMin = timeToMinutes(block.startTime) - startHour * 60
                    const endMin = timeToMinutes(block.endTime) - startHour * 60
                    const top = (startMin / 60) * HOUR_HEIGHT
                    const height = Math.max(32, ((endMin - startMin) / 60) * HOUR_HEIGHT)
                    const color = getCourseColor(block.courseId)
                    const label = shortCourseLabel(block.title, course?.code)

                    const overlapsPreview =
                      previewSection &&
                      meetingOverlapsPreview(
                        block.dayOfWeek,
                        block.startTime,
                        block.endTime,
                        previewSection,
                      )

                    const isPreviewOverlap =
                      overlapsPreview || previewConflictSectionIds.has(block.sectionId)

                    let blockOpacity = 'opacity-100'
                    if (isPreviewActive) {
                      if (isPreviewOverlap) {
                        blockOpacity = 'opacity-100'
                      } else {
                        blockOpacity = 'opacity-35'
                      }
                    }

                    const isConflict = block.hasConflict || isPreviewOverlap
                    const isPreviewOnly = isPreviewOverlap && !block.hasConflict

                    return (
                      <button
                        key={block.id}
                        className={`absolute inset-x-1 z-10 overflow-hidden rounded-md px-2 py-1 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/40 ${blockOpacity} ${
                          isConflict
                            ? 'border border-red-100/90 border-l-[3px] border-l-red-400 bg-red-50/25 hover:bg-red-50/40'
                            : 'border border-black/[0.04] hover:brightness-[0.98]'
                        }`}
                        style={{
                          top,
                          height,
                          backgroundColor: isConflict ? undefined : color.bg,
                        }}
                        onClick={(event) => handleBlockClick(block, event)}
                        onMouseEnter={(event) => handleBlockMouseEnter(block, event)}
                        onMouseLeave={handleBlockMouseLeave}
                        aria-label={`${block.title} — ${formatTimeRange(block.startTime, block.endTime)}${isConflict ? ' — conflicto' : ''}`}
                      >
                        {isConflict && height >= 36 && (
                          <span className="mb-0.5 inline-flex items-center gap-0.5 text-[9px] font-medium text-red-600">
                            <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                            {isPreviewOnly ? 'Solapa' : 'Conflicto'}
                          </span>
                        )}
                        <p className="truncate text-[11px] font-medium leading-tight text-slate-800">
                          {label}
                        </p>
                        {height >= 44 && (
                          <p className="truncate text-[10px] font-normal leading-tight text-slate-500">
                            Sec. {block.sectionCode}
                          </p>
                        )}
                        {height >= 52 && (
                          <p
                            className={`truncate text-[10px] leading-tight ${
                              isConflict ? 'font-normal text-red-600/85' : 'font-normal text-slate-400'
                            }`}
                          >
                            {isConflict
                              ? formatTimeRange(block.startTime, block.endTime)
                              : block.classroom ?? ''}
                          </p>
                        )}
                      </button>
                    )
                  })}

                  {previewSection &&
                    previewBlocks
                      .filter(({ meeting }) => meeting.dayOfWeek === day.value)
                      .map(({ meeting, course }) => {
                        const startMin = timeToMinutes(meeting.startTime) - startHour * 60
                        const endMin = timeToMinutes(meeting.endTime) - startHour * 60
                        const top = (startMin / 60) * HOUR_HEIGHT
                        const height = Math.max(32, ((endMin - startMin) / 60) * HOUR_HEIGHT)
                        const code =
                          course?.code ?? shortCourseLabel(course?.name ?? 'Materia', null)

                        return (
                          <div
                            key={`preview-${meeting.id}`}
                            className={`schedule-preview-in pointer-events-none absolute inset-x-1 z-20 overflow-hidden rounded-md border border-dashed px-2 py-1 text-left transition-colors duration-300 ${
                              hasPreviewConflict
                                ? 'border-red-300/70 border-l-[3px] border-l-red-400 bg-red-50/30'
                                : 'border-rose-300/60 bg-rose-50/40'
                            }`}
                            style={{ top, height }}
                            aria-hidden="true"
                          >
                            <p className="truncate text-[11px] font-medium leading-tight text-slate-800">
                              {code}-{previewSection.sectionCode}
                            </p>
                            {height >= 40 && (
                              <p className="truncate text-[10px] font-normal leading-tight text-slate-500">
                                {formatTimeRange(meeting.startTime, meeting.endTime)}
                              </p>
                            )}
                            {height >= 52 && meeting.classroom && (
                              <p className="truncate text-[10px] font-normal leading-tight text-slate-400">
                                {meeting.classroom}
                              </p>
                            )}
                          </div>
                        )
                      })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
