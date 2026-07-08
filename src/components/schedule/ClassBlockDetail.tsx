/**
 * ClassBlockDetail — Popover compacto con detalle de clase y conflictos
 */
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TeacherNameButton } from '@/components/teachers/TeacherNameButton'
import type { CourseSection } from '@/types/academic'
import { getSectionScheduleTitle } from '@/utils/electiveCourses'
import { getDayLabel } from '@/utils/dates'
import { formatTimeRange, doTimesOverlap, formatOverlapDuration, getOverlapDurationMinutes } from '@/utils/times'

export interface ClassBlockConflict {
  overlapStart: string
  overlapEnd: string
  otherSectionId: string
}

export interface ClassBlockInfo {
  id: string
  sectionId: string
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  title: string
  sectionCode: string
  classroom: string | null
  teacherName: string | null
  teacherEmail?: string | null
  teacherId?: string | null
  academicPeriodId?: string | null
  hasConflict: boolean
  conflictDetails: ClassBlockConflict[]
}

interface ClassBlockDetailProps {
  block: ClassBlockInfo
  sectionsById: Map<string, CourseSection>
  coursesById: Map<string, { name: string; code: string | null }>
  onClose: () => void
  onRemove: (sectionId: string) => void
  onViewAlternatives?: (courseId: string) => void
  removingId: string | null
}

function resolveSectionTitle(
  section: CourseSection | undefined,
  coursesById: Map<string, { name: string; code: string | null }>,
  fallback = 'Materia',
): string {
  if (!section) return fallback
  return getSectionScheduleTitle(section, coursesById.get(section.courseId))
}

function formatMeetingLine(dayOfWeek: number, startTime: string, endTime: string): string {
  return `${getDayLabel(dayOfWeek)} · ${formatTimeRange(startTime, endTime)}`
}

export function ClassBlockDetail({
  block,
  sectionsById,
  coursesById,
  onClose,
  onRemove,
  onViewAlternatives,
  removingId,
}: ClassBlockDetailProps) {
  const currentSection = sectionsById.get(block.sectionId)
  const currentCourseName = resolveSectionTitle(currentSection, coursesById, block.title)
  const hasConflict = block.hasConflict && block.conflictDetails.length > 0

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
      role="dialog"
      aria-labelledby="class-block-detail-title"
      aria-describedby={hasConflict ? 'class-block-conflict-desc' : undefined}
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-3 py-2.5">
        <div className="min-w-0 pr-2">
          {hasConflict ? (
            <>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" aria-hidden="true" />
                <p id="class-block-detail-title" className="text-sm font-semibold leading-snug text-text">
                  Conflicto de horario
                </p>
              </div>
              <p id="class-block-conflict-desc" className="mt-0.5 text-[11px] text-muted">
                Elegí cómo resolver la superposición.
              </p>
            </>
          ) : (
            <>
              <p id="class-block-detail-title" className="text-sm font-semibold leading-snug text-text">
                {block.title}
              </p>
              <p className="text-[11px] text-muted">Sección {block.sectionCode}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"
          aria-label="Cerrar detalle"
        >
          <X className="h-3.5 w-3.5 text-muted" />
        </button>
      </div>

      {hasConflict ? (
        <>
          <div className="space-y-2 px-3 py-2.5">
            {block.conflictDetails.map((conflict) => {
              const otherSection = sectionsById.get(conflict.otherSectionId)
              const otherTitle = resolveSectionTitle(otherSection, coursesById)
              const otherMeeting = otherSection?.meetings.find(
                (meeting) =>
                  meeting.dayOfWeek === block.dayOfWeek &&
                  doTimesOverlap(
                    meeting.startTime,
                    meeting.endTime,
                    conflict.overlapStart,
                    conflict.overlapEnd,
                  ),
              )
              const otherStart = otherMeeting?.startTime ?? ''
              const otherEnd = otherMeeting?.endTime ?? ''

              const overlapMinutes = getOverlapDurationMinutes(
                conflict.overlapStart,
                conflict.overlapEnd,
              )

              return (
                <div
                  key={`${conflict.otherSectionId}-${conflict.overlapStart}`}
                  className="rounded-lg border border-red-100 bg-red-50/70 px-2.5 py-2 text-xs text-red-800"
                >
                  <p className="font-medium">
                    {currentCourseName} y {otherTitle} se superponen ~{' '}
                    {formatOverlapDuration(overlapMinutes)} (
                    {formatTimeRange(conflict.overlapStart, conflict.overlapEnd)})
                  </p>
                  <p className="mt-1 text-[11px] text-red-700/90">
                    {formatMeetingLine(block.dayOfWeek, block.startTime, block.endTime)}
                    {otherStart && otherEnd
                      ? ` · ${formatMeetingLine(block.dayOfWeek, otherStart, otherEnd)}`
                      : ''}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="space-y-1.5 border-t border-slate-100 px-3 py-2.5">
            {onViewAlternatives && (
              <Button
                className="min-h-9 w-full justify-center text-xs"
                onClick={() => onViewAlternatives(block.courseId)}
              >
                Cambiar de sección
              </Button>
            )}
            <Button
              variant="secondary"
              className="min-h-9 w-full justify-center text-xs"
              onClick={onClose}
            >
              Mantener ambas
            </Button>
            <button
              type="button"
              onClick={() => onRemove(block.sectionId)}
              disabled={removingId === block.sectionId}
              className="flex min-h-9 w-full items-center justify-center text-xs font-medium text-red-600 transition hover:text-red-700 disabled:opacity-50"
            >
              Quitar {currentCourseName}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-0.5 px-3 py-2.5 text-xs text-muted">
            <p>{formatMeetingLine(block.dayOfWeek, block.startTime, block.endTime)}</p>
            {block.classroom && <p>Aula: {block.classroom}</p>}
            {block.teacherName && (
              <p className="flex flex-wrap items-center gap-1">
                <span>Docente:</span>
                <TeacherNameButton
                  teacherId={block.teacherId}
                  teacherName={block.teacherName}
                  teacherEmail={block.teacherEmail}
                  courseId={block.courseId}
                  academicPeriodId={block.academicPeriodId}
                  className="text-xs"
                />
              </p>
            )}
            <p className="pt-0.5 text-[10px] text-muted/80">Fuente: datos oficiales FPUNA</p>
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-2.5">
            {onViewAlternatives && (
              <Button
                variant="secondary"
                className="min-h-9 flex-1 justify-center text-xs"
                onClick={() => onViewAlternatives(block.courseId)}
              >
                Cambiar de sección
              </Button>
            )}
            <button
              type="button"
              onClick={() => onRemove(block.sectionId)}
              disabled={removingId === block.sectionId}
              className="min-h-9 flex-1 rounded-lg text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function shortCourseLabel(
  name: string,
  code: string | null | undefined,
  maxLen = 18,
): string {
  if (code) return code
  return name.length > maxLen ? `${name.slice(0, maxLen - 1)}…` : name
}
