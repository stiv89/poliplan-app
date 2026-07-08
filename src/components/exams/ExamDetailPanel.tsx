import type { ReactNode } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { OFFICIAL_SCHEDULE_SOURCE_URL } from '@/config/constants'
import { formatDate } from '@/utils/dates'
import { formatTimeRange } from '@/utils/times'
import {
  EXAM_STATUS_LABELS,
  formatExamTypeLabel,
  formatUpdatedShort,
  getExamChanges,
  getExamDisplayStatus,
  type ExamItem,
} from '@/utils/exams'
import type { ScheduleChange } from '@/types/academic'

interface ExamDetailPanelProps {
  exam: ExamItem
  changes: ScheduleChange[]
  isOnline: boolean
  dataIsStale: boolean
  lastUpdated: string | null
  onClose: () => void
}

const FIELD_LABELS: Record<string, string> = {
  examDate: 'Fecha',
  examTime: 'Horario',
  examClassroom: 'Aula',
}

export function ExamDetailPanel({
  exam,
  changes,
  isOnline,
  dataIsStale,
  lastUpdated,
  onClose,
}: ExamDetailPanelProps) {
  const status = getExamDisplayStatus(exam, changes, isOnline, dataIsStale)
  const examChanges = getExamChanges(exam, changes)
  const timeLabel =
    exam.startTime && exam.endTime
      ? formatTimeRange(exam.startTime, exam.endTime)
      : exam.startTime?.slice(0, 5) ?? 'A confirmar'

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">{formatExamTypeLabel(exam.examType)}</p>
          <h2 className="mt-0.5 text-base font-semibold text-text">
            {exam.courseName}
            <span className="font-normal text-muted"> · Sección {exam.sectionCode}</span>
          </h2>
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
          <DetailItem label="Fecha">
            {exam.examDate ? formatDate(exam.examDate) : 'A confirmar'}
          </DetailItem>
          <DetailItem label="Horario">{timeLabel}</DetailItem>
          <DetailItem label="Aula">{exam.classroom ?? 'A confirmar'}</DetailItem>
          <DetailItem label="Estado">{EXAM_STATUS_LABELS[status]}</DetailItem>
        </dl>

        {examChanges.length > 0 && (
          <div className="mt-5 space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
              Cambios recientes
            </h3>
            {examChanges.map((change) => (
              <div
                key={change.id}
                className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-sm"
              >
                <p className="font-medium text-amber-900">
                  {FIELD_LABELS[change.field] ?? 'Dato'} modificada
                </p>
                {change.previousValue && (
                  <p className="mt-1 text-xs text-muted">
                    Antes:{' '}
                    <span className="line-through">{formatChangeValue(change.field, change.previousValue)}</span>
                  </p>
                )}
                {change.newValue && (
                  <p className="mt-0.5 text-xs text-text">
                    Ahora: {formatChangeValue(change.field, change.newValue)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-muted">
          <p>Fuente oficial</p>
          <p className="mt-1 text-text">{formatUpdatedShort(lastUpdated)}</p>
          <a
            href={OFFICIAL_SCHEDULE_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver fuente oficial
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
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

function formatChangeValue(field: string, value: string): string {
  if (field === 'examDate') {
    return formatDate(value)
  }
  return value
}
