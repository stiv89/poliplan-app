import { useMemo, useState } from 'react'
import { ExamAgenda, ExamAgendaEmpty } from '@/components/exams/ExamAgenda'
import { ExamDetailPanel } from '@/components/exams/ExamDetailPanel'
import { ExamFilterMenu } from '@/components/exams/ExamFilterMenu'
import { ExamMonthCalendar } from '@/components/exams/ExamMonthCalendar'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useDataTrustInfo } from '@/components/ui/DataTrustBanner'
import { useChanges } from '@/hooks/useChanges'
import { useSchedule } from '@/hooks/useSchedule'
import {
  collectExamItems,
  DEFAULT_EXAM_FILTERS,
  filterExamItems,
  getExamsByDateMap,
  getMonthBounds,
  getNextExam,
  groupExamsByDate,
  todayKey,
  type ExamFilters,
  type ExamItem,
  formatUpdatedShort,
} from '@/utils/exams'

export function ExamsPage() {
  const {
    loading,
    selectedSections,
    allSections,
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

  const defaultScope = selectedSections.length > 0 ? 'mine' : 'all'
  const [filters, setFilters] = useState<ExamFilters>({
    ...DEFAULT_EXAM_FILTERS,
    scope: defaultScope,
  })

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

  const sourceSections = filters.scope === 'mine' ? selectedSections : allSections

  const allExamItems = useMemo(
    () => collectExamItems(sourceSections, coursesMap),
    [sourceSections, coursesMap],
  )

  const filteredExams = useMemo(
    () => filterExamItems(allExamItems, filters),
    [allExamItems, filters],
  )

  const examsByDate = useMemo(() => getExamsByDateMap(filteredExams), [filteredExams])

  const monthBounds = getMonthBounds(calendarYear, calendarMonth)
  const today = todayKey()

  const agendaExams = useMemo(() => {
    const list = filteredExams.filter((exam) => exam.examDate)

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
  }, [filteredExams, selectedDateKey, monthBounds.start, monthBounds.end, calendarYear, calendarMonth, today])

  const agendaGroups = useMemo(() => groupExamsByDate(agendaExams), [agendaExams])

  const nextExam = useMemo(() => getNextExam(filteredExams), [filteredExams])

  const dataIsStale = trustInfo
    ? Date.now() - new Date(trustInfo.downloadedAt).getTime() > 7 * 24 * 60 * 60 * 1000
    : false

  const updatedLabel = formatUpdatedShort(lastUpdated ?? trustInfo?.downloadedAt ?? null)

  const hasLocalData = selectedSections.length > 0 || allSections.length > 0

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

  if (loading && !hasLocalData) {
    return <LoadingState label="Cargando exámenes…" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-200/50 bg-white px-4 py-4 md:px-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-text md:text-2xl">Exámenes</h1>
            {activePeriod && (
              <p className="mt-0.5 text-sm text-muted">{activePeriod.name}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              {updatedLabel}
              <span className="text-muted/60"> · Fuente oficial</span>
            </p>
            {!isOnline && (
              <p className="mt-1 text-xs text-amber-700">Usando datos guardados</p>
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
          <div className="hidden md:block">
            <ExamFilterMenu
              filters={filters}
              defaultScope={defaultScope}
              onChange={setFilters}
            />
          </div>
        </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8">
          <div className="mx-auto max-w-3xl space-y-5">
            <div className="flex justify-end md:hidden">
              <ExamFilterMenu
                filters={filters}
                defaultScope={defaultScope}
                onChange={setFilters}
              />
            </div>

            <ExamMonthCalendar
              year={calendarYear}
              month={calendarMonth}
              examsByDate={examsByDate}
              selectedDateKey={selectedDateKey}
              onMonthChange={handleMonthChange}
              onSelectDate={setSelectedDateKey}
              onGoToday={handleGoToday}
            />

            <section>
              <h2 className="text-sm font-semibold text-text">
                {selectedDateKey ? 'Exámenes del día' : 'Próximos exámenes'}
              </h2>

              {agendaGroups.length === 0 ? (
                <ExamAgendaEmpty
                  filtersScopeMine={filters.scope === 'mine'}
                  onShowAll={
                    filters.scope === 'mine'
                      ? () => setFilters((current) => ({ ...current, scope: 'all' }))
                      : undefined
                  }
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
                    changes={changes}
                    isOnline={isOnline}
                    dataIsStale={dataIsStale}
                    onSelectExam={setDetailExam}
                  />
                </div>
              )}
            </section>
          </div>
        </div>

        {detailExam && (
          <aside className="hidden w-[min(360px,34vw)] shrink-0 border-l border-slate-100 bg-surface md:flex md:flex-col">
            <ExamDetailPanel
              exam={detailExam}
              changes={changes}
              isOnline={isOnline}
              dataIsStale={dataIsStale}
              lastUpdated={lastUpdated ?? trustInfo?.downloadedAt ?? null}
              onClose={() => setDetailExam(null)}
            />
          </aside>
        )}
      </div>

      {detailExam && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setDetailExam(null)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:hidden"
            role="dialog"
            aria-label="Detalle de examen"
          >
            <ExamDetailPanel
              exam={detailExam}
              changes={changes}
              isOnline={isOnline}
              dataIsStale={dataIsStale}
              lastUpdated={lastUpdated ?? trustInfo?.downloadedAt ?? null}
              onClose={() => setDetailExam(null)}
            />
          </div>
        </>
      )}
    </div>
  )
}
