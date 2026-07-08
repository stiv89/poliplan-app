import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  buildMonthGrid,
  formatMonthYear,
  todayKey,
  type ExamItem,
} from '@/utils/exams'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

interface ExamMonthCalendarProps {
  year: number
  month: number
  examsByDate: Map<string, ExamItem[]>
  selectedDateKey: string | null
  onMonthChange: (year: number, month: number) => void
  onSelectDate: (dateKey: string | null) => void
  onGoToday: () => void
}

export function ExamMonthCalendar({
  year,
  month,
  examsByDate,
  selectedDateKey,
  onMonthChange,
  onSelectDate,
  onGoToday: _onGoToday,
}: ExamMonthCalendarProps) {
  const grid = buildMonthGrid(year, month)
  const today = todayKey()

  const goPrev = () => {
    const date = new Date(year, month - 1, 1)
    onMonthChange(date.getFullYear(), date.getMonth())
  }

  const goNext = () => {
    const date = new Date(year, month + 1, 1)
    onMonthChange(date.getFullYear(), date.getMonth())
  }

  return (
    <section className="rounded-xl border border-slate-100 bg-surface px-3 py-3 md:px-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-text"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold text-text">{formatMonthYear(year, month)}</h2>
        <button
          type="button"
          onClick={goNext}
          className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-text"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-[10px] font-medium uppercase text-muted">
            {label}
          </div>
        ))}

        {grid.map((cell, index) => {
          if (!cell.dateKey || cell.day == null) {
            return <div key={`empty-${index}`} className="h-9" aria-hidden="true" />
          }

          const dayExams = examsByDate.get(cell.dateKey) ?? []
          const isToday = cell.dateKey === today
          const isSelected = cell.dateKey === selectedDateKey
          const count = dayExams.length

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : cell.dateKey)}
              className={`relative flex h-9 flex-col items-center justify-center rounded-lg text-sm transition ${
                isSelected
                  ? 'bg-primary text-white'
                  : isToday
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-text hover:bg-slate-50'
              }`}
              aria-label={
                count > 0
                  ? `${cell.day}, ${count} examen${count !== 1 ? 'es' : ''}`
                  : `Día ${cell.day}`
              }
              aria-pressed={isSelected}
            >
              <span>{cell.day}</span>
              {count > 0 && (
                <span
                  className={`absolute bottom-0.5 text-[9px] font-semibold leading-none ${
                    isSelected ? 'text-white/90' : 'text-primary'
                  }`}
                >
                  {count > 1 ? count : '·'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function ExamCalendarToolbar({
  onGoToday,
  onOpenFilters,
  filtersActive,
}: {
  onGoToday: () => void
  onOpenFilters: () => void
  filtersActive: boolean
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onGoToday}
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-text transition hover:bg-slate-50"
      >
        Hoy
      </button>
      <button
        type="button"
        onClick={onOpenFilters}
        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
          filtersActive
            ? 'border-primary/30 bg-primary/5 text-primary'
            : 'border-slate-200 text-muted hover:bg-slate-50'
        }`}
      >
        Filtros
      </button>
    </div>
  )
}
