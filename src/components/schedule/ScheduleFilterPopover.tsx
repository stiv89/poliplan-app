import { useEffect, useRef, useState } from 'react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { SCHEDULE_FILTER_CONFIG } from '@/config/scheduleFilters'
import type { AcademicPeriod } from '@/types/academic'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import {
  formatAcademicPeriodLabel,
  formatFilterTimeLabel,
  getAdjacentPeriodId,
  isScheduleViewFiltersActive,
  sortAcademicPeriods,
} from '@/utils/scheduleFilters'

interface ScheduleFilterPopoverProps {
  periods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  filters: ScheduleViewFilters
  onFiltersChange: (filters: ScheduleViewFilters) => void
  align?: 'left' | 'right'
}

export function ScheduleFilterMenu({
  periods,
  selectedPeriodId,
  onPeriodChange,
  filters,
  onFiltersChange,
  align = 'right',
}: ScheduleFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const isActive = isScheduleViewFiltersActive(filters)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2 text-xs transition ${
          open || isActive
            ? 'border-primary/25 bg-primary/8 text-primary'
            : 'border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
        aria-label="Filtros del horario"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Filtros</span>
        {isActive && (
          <span
            className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
            aria-hidden="true"
          />
        )}
      </button>

      <AnimatedPopover
        open={open}
        anchorRef={buttonRef}
        popoverRef={popoverRef}
        align={align}
        className="w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl"
      >
        <ScheduleFilterPopoverContent
          periods={periods}
          selectedPeriodId={selectedPeriodId}
          onPeriodChange={onPeriodChange}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </AnimatedPopover>
    </>
  )
}

function ScheduleFilterPopoverContent({
  periods,
  selectedPeriodId,
  onPeriodChange,
  filters,
  onFiltersChange,
}: Omit<ScheduleFilterPopoverProps, 'align'>) {
  const sortedPeriods = sortAcademicPeriods(periods)
  const selectedPeriod =
    sortedPeriods.find((period) => period.id === selectedPeriodId) ??
    sortedPeriods.find((period) => period.isActive) ??
    sortedPeriods[0]

  const periodLabel = selectedPeriod
    ? formatAcademicPeriodLabel(selectedPeriod)
    : 'Sin períodos'

  const canGoPrev = Boolean(
    selectedPeriod && getAdjacentPeriodId(sortedPeriods, selectedPeriod.id, -1),
  )
  const canGoNext = Boolean(
    selectedPeriod && getAdjacentPeriodId(sortedPeriods, selectedPeriod.id, 1),
  )

  const { minMinutes, maxMinutes, stepMinutes } = SCHEDULE_FILTER_CONFIG.timeRange

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl bg-slate-100/90 p-1">
        <button
          type="button"
          disabled={!canGoPrev || !selectedPeriod}
          onClick={() => {
            if (!selectedPeriod) return
            const prevId = getAdjacentPeriodId(sortedPeriods, selectedPeriod.id, -1)
            if (prevId) onPeriodChange(prevId)
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-white disabled:opacity-30"
          aria-label="Período anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="min-w-0 flex-1 truncate px-1 text-center text-sm font-medium text-text">
          {periodLabel}
        </p>
        <button
          type="button"
          disabled={!canGoNext || !selectedPeriod}
          onClick={() => {
            if (!selectedPeriod) return
            const nextId = getAdjacentPeriodId(sortedPeriods, selectedPeriod.id, 1)
            if (nextId) onPeriodChange(nextId)
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-white disabled:opacity-30"
          aria-label="Período siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
          Días
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SCHEDULE_FILTER_CONFIG.availableDays.map((day) => {
            const active = filters.days.includes(day)
            const label = SCHEDULE_FILTER_CONFIG.dayLabels[day] ?? String(day)
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  const days = active
                    ? filters.days.filter((value) => value !== day)
                    : [...filters.days, day].sort((a, b) => a - b)
                  onFiltersChange({ ...filters, days })
                }}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-muted hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-text">
          <span>{formatFilterTimeLabel(filters.timeStartMinutes)}</span>
          <span>{formatFilterTimeLabel(filters.timeEndMinutes)}</span>
        </div>
        <DualRangeSlider
          min={minMinutes}
          max={maxMinutes}
          step={stepMinutes}
          start={filters.timeStartMinutes}
          end={filters.timeEndMinutes}
          onChange={(timeStartMinutes, timeEndMinutes) =>
            onFiltersChange({ ...filters, timeStartMinutes, timeEndMinutes })
          }
        />
      </div>
    </div>
  )
}

function DualRangeSlider({
  min,
  max,
  step,
  start,
  end,
  onChange,
}: {
  min: number
  max: number
  step: number
  start: number
  end: number
  onChange: (start: number, end: number) => void
}) {
  const range = max - min
  const startPct = ((start - min) / range) * 100
  const endPct = ((end - min) / range) * 100

  return (
    <div className="relative h-8">
      <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
        style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={start}
        onChange={(event) => {
          const nextStart = Number(event.target.value)
          onChange(Math.min(nextStart, end - step), end)
        }}
        className="range-thumb absolute inset-0 z-20 w-full appearance-none bg-transparent"
        aria-label="Hora de inicio"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={end}
        onChange={(event) => {
          const nextEnd = Number(event.target.value)
          onChange(start, Math.max(nextEnd, start + step))
        }}
        className="range-thumb absolute inset-0 z-30 w-full appearance-none bg-transparent"
        aria-label="Hora de fin"
      />
      <style>{`
        .range-thumb {
          height: 100%;
          background: transparent;
        }
        .range-thumb::-webkit-slider-runnable-track {
          appearance: none;
          background: transparent;
        }
        .range-thumb::-moz-range-track {
          background: transparent;
        }
        .range-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          margin-top: -7px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #0B3B8F;
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
          cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #0B3B8F;
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
