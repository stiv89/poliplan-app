import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import examsEmptyIllustration from '../../logos/empty.png'
import { ExamAgenda, ExamAgendaEmpty } from '@/components/exams/ExamAgenda'
import { ExamDetailPanel } from '@/components/exams/ExamDetailPanel'
import { ExamMonthCalendar } from '@/components/exams/ExamMonthCalendar'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useDataTrustInfo } from '@/components/ui/DataTrustBanner'
import { ROUTES } from '@/config/constants'
import { useChanges } from '@/hooks/useChanges'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useSchedule } from '@/hooks/useSchedule'
import {
  collectExamItems,
  getExamsByDateMap,
  getMonthBounds,
  getNextExam,
  groupExamsByDate,
  todayKey,
  type ExamItem,
  formatUpdatedShort,
} from '@/utils/exams'
import type { ScheduleChange } from '@/types/academic'

export function ExamsPage() {
  const {
    loading,
    selectedSections,
    coursesById,
    activePeriod,
    lastUpdated,
    isOnline,
    syncNow,
  } = useSchedule()

  const { changes } = useChanges()
  const trustInfo = useDataTrustInfo()

  const now = new Date()
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [detailExam, setDetailExam] = useState<ExamItem | null>(null)
  const [syncing, setSyncing] = useState(false)
  const hasScheduleCourses = selectedSections.length > 0

  const coursesMap = useMemo(
    () =>
      new Map(
        [...coursesById.entries()].map(([id, course]) => [
          id,
          { name: course.name, code: course.code },
        ]),
      ),
    [coursesById],
  )

  const allExamItems = useMemo(
    () => collectExamItems(selectedSections, coursesMap),
    [selectedSections, coursesMap],
  )

  const examsByDate = useMemo(() => getExamsByDateMap(allExamItems), [allExamItems])

  const monthBounds = getMonthBounds(calendarYear, calendarMonth)
  const today = todayKey()

  const agendaExams = useMemo(() => {
    const list = allExamItems.filter((exam) => exam.examDate)

    if (selectedDateKey) {
      return list.filter((exam) => exam.examDate === selectedDateKey)
    }

    const inMonth = list.filter(
      (exam) => exam.examDate! >= monthBounds.start && exam.examDate! <= monthBounds.end,
    )

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const isCurrentMonth = calendarYear === currentYear && calendarMonth === currentMonth

    if (isCurrentMonth) {
      return inMonth.filter((exam) => exam.examDate! >= today)
    }

    return inMonth
  }, [allExamItems, selectedDateKey, monthBounds.start, monthBounds.end, calendarYear, calendarMonth, today])

  const agendaGroups = useMemo(() => groupExamsByDate(agendaExams), [agendaExams])

  const nextExam = useMemo(() => getNextExam(allExamItems), [allExamItems])

  const dataIsStale = trustInfo
    ? Date.now() - new Date(trustInfo.downloadedAt).getTime() > 7 * 24 * 60 * 60 * 1000
    : false

  const updatedLabel = formatUpdatedShort(lastUpdated ?? trustInfo?.downloadedAt ?? null)

  const handleGoToday = () => {
    const current = new Date()
    setCalendarYear(current.getFullYear())
    setCalendarMonth(current.getMonth())
    setSelectedDateKey(todayKey())
  }

  const handleMonthChange = (year: number, month: number) => {
    setCalendarYear(year)
    setCalendarMonth(month)
    setSelectedDateKey(null)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncNow(true)
    } finally {
      setSyncing(false)
    }
  }

  if (loading && !hasScheduleCourses) {
    return <LoadingState label="Cargando exámenes…" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-200/50 bg-slate-50/45 px-4 py-2 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <h1 className="text-base font-bold tracking-tight text-text md:text-lg">Exámenes</h1>
            {activePeriod && (
              <span className="truncate text-xs text-muted">{activePeriod.name}</span>
            )}
            <span className="hidden text-xs text-muted sm:inline">
              {updatedLabel}
              <span className="text-muted/60"> · Fuente oficial</span>
            </span>
            {!isOnline && (
              <span className="text-[11px] text-amber-700 sm:ml-1">Sin conexión</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleGoToday}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-text transition hover:bg-slate-50"
            >
              Hoy
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4">
        {!hasScheduleCourses ? (
          <div className="flex min-h-full items-center justify-center">
            <ExamsScheduleEmptyState />
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-[1120px] gap-6 md:grid-cols-[29fr_21fr] md:items-start">
            <ExamMonthCalendar
              year={calendarYear}
              month={calendarMonth}
              examsByDate={examsByDate}
              selectedDateKey={selectedDateKey}
              onMonthChange={handleMonthChange}
              onSelectDate={setSelectedDateKey}
              onGoToday={handleGoToday}
            />

            <section className="min-w-0">
              <h2 className="text-sm font-semibold text-text">
                {selectedDateKey ? 'Exámenes del día' : 'Próximos exámenes'}
              </h2>

              {agendaGroups.length === 0 ? (
                <ExamAgendaEmpty
                  hasScheduleCourses
                  onSync={isOnline ? handleSync : undefined}
                  syncing={syncing}
                />
              ) : (
                <div className="mt-3">
                  <ExamAgenda
                    groups={agendaGroups}
                    nextExamId={
                      nextExam && !selectedDateKey && agendaExams.some((e) => e.id === nextExam.id)
                        ? nextExam.id
                        : null
                    }
                    selectedExamId={detailExam?.id ?? null}
                    changes={changes}
                    isOnline={isOnline}
                    dataIsStale={dataIsStale}
                    onSelectExam={setDetailExam}
                  />
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {detailExam && (
        <ExamDetailOverlay
          exam={detailExam}
          changes={changes}
          isOnline={isOnline}
          dataIsStale={dataIsStale}
          lastUpdated={lastUpdated ?? trustInfo?.downloadedAt ?? null}
          onClose={() => setDetailExam(null)}
        />
      )}
    </div>
  )
}

function ExamDetailOverlay({
  exam,
  changes,
  isOnline,
  dataIsStale,
  lastUpdated,
  onClose,
}: {
  exam: ExamItem
  changes: ScheduleChange[]
  isOnline: boolean
  dataIsStale: boolean
  lastUpdated: string | null
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(true, panelRef, onClose)

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:bg-black/[0.06] md:backdrop-blur-none"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="exam-detail-panel-enter fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:inset-x-auto md:inset-y-0 md:right-0 md:bottom-auto md:top-0 md:h-full md:max-h-none md:w-[380px] md:rounded-none md:border-l md:border-t-0 md:shadow-[-12px_0_32px_rgba(15,23,42,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de examen"
      >
        <ExamDetailPanel
          exam={exam}
          changes={changes}
          isOnline={isOnline}
          dataIsStale={dataIsStale}
          lastUpdated={lastUpdated}
          onClose={onClose}
        />
      </div>
    </>
  )
}

function ExamsScheduleEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center md:py-14">
      <img
        src={examsEmptyIllustration}
        alt="Ilustración de exámenes"
        width={480}
        height={480}
        className="mb-6 h-auto max-h-[200px] w-[clamp(160px,38vw,220px)] object-contain opacity-90"
        draggable={false}
      />
      <h2 className="text-base font-semibold tracking-tight text-text md:text-lg">
        Agregá materias a tu horario
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Acá vas a ver los exámenes de las materias que sumes al horario, con fechas del calendario
        oficial.
      </p>
      <Link
        to={ROUTES.home}
        className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium !text-white transition hover:bg-primary/90 hover:!text-white"
      >
        Ir al horario
      </Link>
    </div>
  )
}
