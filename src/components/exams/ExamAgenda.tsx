import {
  EXAM_STATUS_LABELS,
  formatExamDayHeader,
  formatExamTypeLabel,
  getExamDisplayStatus,
  type ExamItem,
} from '@/utils/exams'
import type { ScheduleChange } from '@/types/academic'

interface ExamAgendaProps {
  groups: Array<{ date: string; exams: ExamItem[] }>
  nextExamId: string | null
  changes: ScheduleChange[]
  isOnline: boolean
  dataIsStale: boolean
  onSelectExam: (exam: ExamItem) => void
}

export function ExamAgenda({
  groups,
  nextExamId,
  changes,
  isOnline,
  dataIsStale,
  onSelectExam,
}: ExamAgendaProps) {
  if (groups.length === 0) {
    return null
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.date}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            {formatExamDayHeader(group.date)}
          </h3>
          <ul className="mt-2 divide-y divide-slate-100">
            {group.exams.map((exam) => (
              <ExamAgendaRow
                key={exam.id}
                exam={exam}
                isNext={exam.id === nextExamId}
                changes={changes}
                isOnline={isOnline}
                dataIsStale={dataIsStale}
                onSelect={() => onSelectExam(exam)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ExamAgendaRow({
  exam,
  isNext,
  changes,
  isOnline,
  dataIsStale,
  onSelect,
}: {
  exam: ExamItem
  isNext: boolean
  changes: ScheduleChange[]
  isOnline: boolean
  dataIsStale: boolean
  onSelect: () => void
}) {
  const status = getExamDisplayStatus(exam, changes, isOnline, dataIsStale)
  const classroom = exam.classroom ?? 'A confirmar'

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full gap-3 py-3 text-left transition hover:bg-slate-50/80 ${
          isNext ? 'border-l-2 border-l-primary pl-2' : ''
        }`}
      >
        <span className="w-14 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-text">
          {exam.startTime ? exam.startTime.slice(0, 5) : '—'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-primary">
              {formatExamTypeLabel(exam.examType)}
            </span>
            {isNext && (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Próximo
              </span>
            )}
            {status === 'modified' && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                Modificado
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-sm font-medium text-text">{exam.courseName}</span>
          <span className="mt-0.5 block text-xs text-muted">
            Sección {exam.sectionCode} · {classroom}
          </span>
          {status !== 'confirmed' && status !== 'modified' && (
            <span className="mt-1 block text-[11px] text-muted">{EXAM_STATUS_LABELS[status]}</span>
          )}
        </span>
      </button>
    </li>
  )
}

export function ExamAgendaEmpty({
  filtersScopeMine,
  onShowAll,
  onSync,
  syncing,
}: {
  filtersScopeMine: boolean
  onShowAll?: () => void
  onSync?: () => void
  syncing?: boolean
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-medium text-text">No hay exámenes programados</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        {filtersScopeMine
          ? 'Cuando se publiquen fechas oficiales para tus materias, aparecerán acá.'
          : 'No encontramos exámenes para este periodo con los filtros actuales.'}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {filtersScopeMine && onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-text hover:bg-slate-50"
          >
            Ver todos los exámenes
          </button>
        )}
        {onSync && (
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {syncing ? 'Buscando…' : 'Buscar actualizaciones'}
          </button>
        )}
      </div>
    </div>
  )
}
