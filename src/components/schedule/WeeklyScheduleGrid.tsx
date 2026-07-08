/**
 * WeeklyScheduleGrid — Calendario semanal protagonista
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { DAYS_OF_WEEK, getCourseColor } from '@/config/constants'
import { DEFAULT_SCHEDULE_VIEW_FILTERS } from '@/types/scheduleFilters'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import { formatTimeRange, timeToMinutes } from '@/utils/times'
import { meetingMatchesViewFilters } from '@/utils/scheduleFilters'
import {
  getPreviewConflicts,
  meetingOverlapsPreview,
} from '@/utils/conflicts'
import {
  ClassBlockDetail,
  shortCourseLabel,
  type ClassBlockConflict,
  type ClassBlockInfo,
} from '@/components/schedule/ClassBlockDetail'
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
  const [activeBlock, setActiveBlock] = useState<ClassBlockInfo | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastScrolledPreviewId = useRef<string | null>(null)

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

  const conflictSectionIds = new Set<string>()
  for (const c of conflicts) {
    conflictSectionIds.add(c.firstSectionId)
    conflictSectionIds.add(c.secondSectionId)
  }

  const conflictsBySectionId = new Map<string, ClassBlockConflict[]>()
  for (const c of conflicts) {
    const add = (id: string, other: string) => {
      const existing = conflictsBySectionId.get(id) ?? []
      existing.push({ overlapStart: c.overlapStart, overlapEnd: c.overlapEnd, otherSectionId: other })
      conflictsBySectionId.set(id, existing)
    }
    add(c.firstSectionId, c.secondSectionId)
    add(c.secondSectionId, c.firstSectionId)
  }

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
      .map((meeting) => ({
        id: meeting.id,
        sectionId: section.id,
        courseId: section.courseId,
        dayOfWeek: meeting.dayOfWeek,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        title: course?.name ?? 'Materia',
        sectionCode: section.sectionCode,
        classroom: meeting.classroom,
        teacherName: section.teacherName,
        teacherEmail: section.teacherEmail,
        teacherId: section.teacherId,
        academicPeriodId: section.academicPeriodId,
        hasConflict: conflictSectionIds.has(section.id),
        conflictDetails: conflictsBySectionId.get(section.id) ?? [],
      }))
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
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {activeBlock && (
        <div className="absolute inset-0 z-50 flex items-start justify-center px-4 pt-12">
          <ClassBlockDetail
            block={activeBlock}
            sectionsById={sectionsById}
            coursesById={coursesById}
            onClose={() => setActiveBlock(null)}
            onRemove={(id) => {
              onRemoveSection(id)
              setActiveBlock(null)
            }}
            onViewAlternatives={
              onViewAlternatives
                ? (courseId) => {
                    setActiveBlock(null)
                    onViewAlternatives(courseId)
                  }
                : undefined
            }
            removingId={removingId}
          />
        </div>
      )}

      <div
        className={`grid shrink-0 bg-surface/80 transition-opacity duration-300 ${
          isPreviewActive ? 'opacity-60' : 'opacity-100'
        }`}
        style={{ gridTemplateColumns: columnTemplate }}
      >
        <div />
        {visibleDays.map((day) => (
          <div
            key={day.value}
            className="px-1 py-2.5 text-center text-[11px] font-medium text-muted"
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
                  <span className="text-[10px] text-muted/50">{hour}:00</span>
                </div>
              ))}
            </div>

            {visibleDays.map((day) => {
              const dayBlocks = blocks.filter((block) => block.dayOfWeek === day.value)

              return (
                <div key={day.value} className="relative">
                  {hourSlots.map((hour) => (
                    <div
                      key={hour}
                      className="absolute inset-x-0 border-t border-slate-100/80"
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

                    return (
                      <button
                        key={block.id}
                        className={`absolute inset-x-1 z-10 overflow-hidden rounded-lg px-2 py-1.5 text-left text-xs transition-all duration-300 ease-out hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${blockOpacity} ${
                          block.hasConflict || isPreviewOverlap
                            ? 'border-2 border-red-400 bg-red-50/90 ring-2 ring-red-200/50'
                            : 'border border-transparent'
                        }`}
                        style={{
                          top,
                          height,
                          backgroundColor:
                            block.hasConflict || isPreviewOverlap ? undefined : color.bg,
                          color: block.hasConflict || isPreviewOverlap ? '#B91C1C' : color.text,
                        }}
                        onClick={() => setActiveBlock(block)}
                        aria-label={`${block.title} — ${formatTimeRange(block.startTime, block.endTime)}${block.hasConflict || isPreviewOverlap ? ' — conflicto' : ''}`}
                      >
                        {(block.hasConflict || isPreviewOverlap) && height >= 40 && (
                          <span className="mb-0.5 flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            {isPreviewOverlap && !block.hasConflict ? 'Solapa' : 'Conflicto'}
                          </span>
                        )}
                        <p className="truncate font-semibold leading-tight">{label}</p>
                        {height >= 44 && (
                          <p className="truncate text-[10px] opacity-80 leading-tight">
                            Sec. {block.sectionCode}
                          </p>
                        )}
                        {height >= 56 && block.classroom && (
                          <p className="truncate text-[10px] opacity-70 leading-tight">
                            {block.classroom}
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
                            className={`schedule-preview-in pointer-events-none absolute inset-x-1 z-20 overflow-hidden rounded-lg border-2 px-2 py-1.5 text-left text-xs shadow-md transition-colors duration-300 ${
                              hasPreviewConflict
                                ? 'border-red-400/90 bg-red-100/95 text-red-950'
                                : 'border-rose-300/80 bg-rose-100/95 text-rose-950'
                            }`}
                            style={{ top, height }}
                            aria-hidden="true"
                          >
                            <p className="truncate font-semibold leading-tight">
                              {code}-{previewSection.sectionCode}
                            </p>
                            {height >= 40 && (
                              <p className="truncate text-[10px] leading-tight opacity-90">
                                {formatTimeRange(meeting.startTime, meeting.endTime)}
                              </p>
                            )}
                            {height >= 52 && meeting.classroom && (
                              <p className="truncate text-[10px] leading-tight opacity-80">
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
