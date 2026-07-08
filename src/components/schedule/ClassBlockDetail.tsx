/**
 * ClassBlockDetail — Popover compacto con detalle de una clase
 */
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TeacherNameButton } from '@/components/teachers/TeacherNameButton'
import { getDayLabel } from '@/utils/dates'
import { formatTimeRange } from '@/utils/times'
import type { CourseSection } from '@/types/academic'

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

export function ClassBlockDetail({
  block,
  sectionsById,
  coursesById,
  onClose,
  onRemove,
  onViewAlternatives,
  removingId,
}: ClassBlockDetailProps) {
  return (
    <>
      <div className="absolute inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-50 w-full max-w-sm rounded-2xl border border-slate-200 bg-surface shadow-xl"
        role="dialog"
        aria-label={`Detalle de ${block.title}`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
          <div className="min-w-0 pr-2">
            <p className="font-semibold text-text leading-snug">{block.title}</p>
            <p className="text-xs text-muted">Sección {block.sectionCode}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 hover:bg-slate-100"
            aria-label="Cerrar detalle"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        <div className="space-y-1 px-4 py-3 text-sm text-muted">
          <p>
            {getDayLabel(block.dayOfWeek)} · {formatTimeRange(block.startTime, block.endTime)}
          </p>
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
              />
            </p>
          )}
          <p className="text-xs text-muted/80">Fuente: datos oficiales FPUNA</p>
        </div>

        {block.hasConflict && block.conflictDetails.length > 0 && (
          <div className="border-t border-red-100 bg-red-50/80 px-4 py-3 space-y-2">
            {block.conflictDetails.map((c, i) => {
              const otherSection = sectionsById.get(c.otherSectionId)
              const otherCourse = otherSection
                ? coursesById.get(otherSection.courseId)
                : undefined
              return (
                <div key={i} className="text-xs text-red-700">
                  <p className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Conflicto de {formatTimeRange(c.overlapStart, c.overlapEnd)}
                  </p>
                  {otherSection && (
                    <p className="mt-0.5 pl-5 opacity-90">
                      con {otherCourse?.name ?? 'Materia'} — Sección {otherSection.sectionCode}
                    </p>
                  )}
                </div>
              )
            })}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="danger"
                onClick={() => onRemove(block.sectionId)}
                disabled={removingId === block.sectionId}
                className="text-xs"
              >
                Quitar esta sección
              </Button>
              {onViewAlternatives && (
                <Button
                  variant="secondary"
                  onClick={() => onViewAlternatives(block.courseId)}
                  className="text-xs"
                >
                  Ver alternativas
                </Button>
              )}
              <Button variant="secondary" onClick={onClose} className="text-xs">
                Mantener igualmente
              </Button>
            </div>
          </div>
        )}

        {!block.hasConflict && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
            <Button
              variant="danger"
              onClick={() => onRemove(block.sectionId)}
              disabled={removingId === block.sectionId}
              className="text-xs"
            >
              Quitar
            </Button>
            {onViewAlternatives && (
              <Button
                variant="secondary"
                onClick={() => onViewAlternatives(block.courseId)}
                className="text-xs"
              >
                Ver otras secciones
              </Button>
            )}
          </div>
        )}
      </div>
    </>
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
