import type { ReactNode } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import { TeacherNameButton } from '@/components/teachers/TeacherNameButton'
import { Button } from '@/components/ui/Button'
import type { CourseSection, ScheduleConflict } from '@/types/academic'
import { formatDate } from '@/utils/dates'
import {
  formatScheduleCompact,
  getSectionConflictMessages,
} from '@/utils/sectionDisplay'
import { resolveSectionShift } from '@/utils/sectionCode'

interface SectionDetailPanelProps {
  section: CourseSection
  courseName: string
  courseCode: string | null
  selected: boolean
  conflicts: ScheduleConflict[]
  selectedSections: CourseSection[]
  siblingSections: CourseSection[]
  coursesById: Map<string, { name: string }>
  allSectionsById: Map<string, CourseSection>
  toggleLoading: boolean
  onToggle: () => void
  onSelectSibling: (section: CourseSection) => void
  onClose: () => void
  progressLabel?: string | null
}

export function SectionDetailPanel({
  section,
  courseName,
  courseCode,
  selected,
  conflicts,
  selectedSections,
  siblingSections,
  coursesById,
  allSectionsById,
  toggleLoading,
  onToggle,
  onSelectSibling,
  onClose,
  progressLabel,
}: SectionDetailPanelProps) {
  const schedule = formatScheduleCompact(section.meetings)
  const classrooms = [
    ...new Set(section.meetings.map((meeting) => meeting.classroom).filter(Boolean)),
  ].join(', ')
  const conflictMessages = getSectionConflictMessages(
    section,
    selected,
    selectedSections,
    conflicts,
    coursesById,
    allSectionsById,
  )

  const shift = resolveSectionShift(section)

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text">{courseName}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {[courseCode, `Sección ${section.sectionCode}`, shift].filter(Boolean).join(' · ')}
          </p>
          {progressLabel && (
            <p className="mt-1 text-xs text-muted">{progressLabel}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-slate-100"
          aria-label="Cerrar detalle"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <dl className="space-y-3 text-sm">
          <DetailItem label="Docente">
            {section.teacherName ? (
              <TeacherNameButton
                teacherId={section.teacherId}
                teacherName={section.teacherName}
                teacherEmail={section.teacherEmail}
                courseId={section.courseId}
                academicPeriodId={section.academicPeriodId}
                className="text-primary hover:underline"
              />
            ) : (
              'Sin docente asignado'
            )}
          </DetailItem>
          <DetailItem label="Horario">{schedule}</DetailItem>
          {shift && <DetailItem label="Turno">{shift}</DetailItem>}
          {classrooms && <DetailItem label="Aula">{classrooms}</DetailItem>}
        </dl>

        {section.exams.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Exámenes</h3>
            <ul className="mt-2 space-y-2">
              {section.exams.map((exam) => (
                <li key={exam.id} className="text-sm text-text">
                  <span className="font-medium">{exam.examType}</span>
                  {exam.examDate && (
                    <span className="text-muted"> · {formatDate(exam.examDate)}</span>
                  )}
                  {exam.startTime && exam.endTime && (
                    <span className="text-muted">
                      {' '}
                      · {exam.startTime.slice(0, 5)}–{exam.endTime.slice(0, 5)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {conflictMessages.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2.5">
            {conflictMessages.map((message) => (
              <p key={message} className="flex items-center gap-1.5 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {message}
              </p>
            ))}
          </div>
        )}

        {siblingSections.length > 1 && (
          <div className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
              Otras secciones
            </h3>
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-100">
              {siblingSections
                .filter((sibling) => sibling.id !== section.id)
                .map((sibling) => (
                  <li key={sibling.id}>
                    <button
                      type="button"
                      onClick={() => onSelectSibling(sibling)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <span>Sección {sibling.sectionCode}</span>
                      <span className="text-xs text-muted">
                        {formatScheduleCompact(sibling.meetings)}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 p-4">
        <Button
          className="w-full justify-center gap-1.5"
          variant={selected ? 'secondary' : 'primary'}
          onClick={onToggle}
          disabled={toggleLoading}
        >
          {selected ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Quitar del horario
            </>
          ) : (
            'Agregar al horario'
          )}
        </Button>
      </div>
    </div>
  )
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-text">{children}</dd>
    </div>
  )
}
