import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { Button } from '@/components/ui/Button'
import type { AcademicPeriod } from '@/types/academic'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import {
  formatAcademicPeriodLabel,
  formatFilterTimeLabel,
  getAdjacentPeriodId,
  sortAcademicPeriods,
} from '@/utils/scheduleFilters'
import {
  clearSectionExplorerFilters,
  countSectionExplorerFilters,
  EXPLORER_SHIFT_OPTIONS,
  SCHEDULE_FILTER_CONFIG,
  semesterOptions,
} from '@/utils/sectionExplorerFilters'

function useIsMobileLayout() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return mobile
}

interface SectionExplorerFilterMenuProps {
  periods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  viewFilters: ScheduleViewFilters
  onViewFiltersChange: (filters: ScheduleViewFilters) => void
  semesterFilter: number | null
  onSemesterFilterChange: (semester: number | null) => void
  availableSemesters: number[]
  shiftFilter: string | null
  onShiftFilterChange: (shift: string | null) => void
  resultCount: number
  align?: 'left' | 'right'
}

export function SectionExplorerFilterMenu({
  periods,
  selectedPeriodId,
  onPeriodChange,
  viewFilters,
  onViewFiltersChange,
  semesterFilter,
  onSemesterFilterChange,
  availableSemesters,
  shiftFilter,
  onShiftFilterChange,
  resultCount,
  align = 'left',
}: SectionExplorerFilterMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobileLayout()

  const activeCount = countSectionExplorerFilters({
    semesterFilter,
    shiftFilter,
    viewFilters,
  })

  useEffect(() => {
    if (!open || isMobile) return

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
  }, [open, isMobile])

  function handleClear() {
    clearSectionExplorerFilters(
      onSemesterFilterChange,
      onShiftFilterChange,
      onViewFiltersChange,
    )
  }

  const content = (
    <ExplorerFilterPanelContent
      periods={periods}
      selectedPeriodId={selectedPeriodId}
      onPeriodChange={onPeriodChange}
      viewFilters={viewFilters}
      onViewFiltersChange={onViewFiltersChange}
      semesterFilter={semesterFilter}
      onSemesterFilterChange={onSemesterFilterChange}
      availableSemesters={availableSemesters}
      shiftFilter={shiftFilter}
      onShiftFilterChange={onShiftFilterChange}
      resultCount={resultCount}
      onClear={handleClear}
      onApply={() => setOpen(false)}
    />
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs font-normal transition ${
          open || activeCount > 0
            ? 'border-slate-300 bg-slate-50 text-slate-700'
            : 'border-slate-200/80 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50/80'
        }`}
        aria-label={
          activeCount > 0 ? `Filtros, ${activeCount} activos` : 'Filtros del explorador de materias'
        }
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Filtros{activeCount > 0 ? ` · ${activeCount}` : ''}</span>
      </button>

      {open && isMobile && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-slate-200/80 bg-white"
            role="dialog"
            aria-label="Filtros"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-medium text-slate-800">Filtros</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100/80"
                aria-label="Cerrar filtros"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{content}</div>
          </div>
        </>
      )}

      {!isMobile && (
        <AnimatedPopover
          open={open}
          anchorRef={buttonRef}
          popoverRef={popoverRef}
          align={align}
          className="w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          {content}
        </AnimatedPopover>
      )}
    </>
  )
}

function ExplorerFilterPanelContent({
  periods,
  selectedPeriodId,
  onPeriodChange,
  viewFilters,
  onViewFiltersChange,
  semesterFilter,
  onSemesterFilterChange,
  availableSemesters,
  shiftFilter,
  onShiftFilterChange,
  resultCount,
  onClear,
  onApply,
}: {
  periods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  viewFilters: ScheduleViewFilters
  onViewFiltersChange: (filters: ScheduleViewFilters) => void
  semesterFilter: number | null
  onSemesterFilterChange: (semester: number | null) => void
  availableSemesters: number[]
  shiftFilter: string | null
  onShiftFilterChange: (shift: string | null) => void
  resultCount: number
  onClear: () => void
  onApply: () => void
}) {
  const sortedPeriods = sortAcademicPeriods(periods)
  const selectedPeriod =
    sortedPeriods.find((period) => period.id === selectedPeriodId) ??
    sortedPeriods.find((period) => period.isActive) ??
    sortedPeriods[0]

  const { minMinutes, maxMinutes, stepMinutes } = SCHEDULE_FILTER_CONFIG.timeRange
  const availableSemesterSet = new Set(availableSemesters)

  return (
    <div className="space-y-5">
      {sortedPeriods.length > 0 && (
        <PeriodNavigator
          periods={sortedPeriods}
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
        />
      )}

      <FilterSection title="Semestre">
        <div className="flex flex-wrap gap-1.5">
          <FilterChipButton
            selected={semesterFilter == null}
            onClick={() => onSemesterFilterChange(null)}
          >
            Todos
          </FilterChipButton>
          {semesterOptions().map((semester) => (
            <FilterChipButton
              key={semester}
              selected={semesterFilter === semester}
              onClick={() => onSemesterFilterChange(semester)}
              disabled={!availableSemesterSet.has(semester)}
            >
              {semester}.º
            </FilterChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Turno">
        <div className="flex flex-wrap gap-1.5">
          <FilterChipButton
            selected={shiftFilter == null}
            onClick={() => onShiftFilterChange(null)}
          >
            Todos
          </FilterChipButton>
          {EXPLORER_SHIFT_OPTIONS.map((shift) => (
            <FilterChipButton
              key={shift}
              selected={shiftFilter === shift}
              onClick={() => onShiftFilterChange(shift)}
            >
              {shift}
            </FilterChipButton>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Días">
        <div className="flex flex-wrap gap-1.5">
          {SCHEDULE_FILTER_CONFIG.availableDays.map((day) => {
            const active = viewFilters.days.includes(day)
            const label = SCHEDULE_FILTER_CONFIG.dayLabels[day] ?? String(day)
            return (
              <FilterChipButton
                key={day}
                selected={active}
                subtleSelected
                onClick={() => {
                  const days = active
                    ? viewFilters.days.filter((value) => value !== day)
                    : [...viewFilters.days, day].sort((a, b) => a - b)
                  onViewFiltersChange({ ...viewFilters, days })
                }}
              >
                {label}
              </FilterChipButton>
            )
          })}
        </div>
      </FilterSection>

      <FilterSection title="Horario visible">
        <div className="mb-2 flex items-center justify-between text-[11px] font-normal text-slate-500">
          <span>{formatFilterTimeLabel(viewFilters.timeStartMinutes)}</span>
          <span>{formatFilterTimeLabel(viewFilters.timeEndMinutes)}</span>
        </div>
        <DualRangeSlider
          min={minMinutes}
          max={maxMinutes}
          step={stepMinutes}
          start={viewFilters.timeStartMinutes}
          end={viewFilters.timeEndMinutes}
          onChange={(timeStartMinutes, timeEndMinutes) =>
            onViewFiltersChange({ ...viewFilters, timeStartMinutes, timeEndMinutes })
          }
        />
      </FilterSection>

      <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClear}
          className="min-h-10 flex-1 rounded-lg text-sm font-normal text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        >
          Limpiar
        </button>
        <Button className="min-h-10 flex-[1.35] justify-center text-sm" onClick={onApply}>
          Ver {resultCount} sección{resultCount !== 1 ? 'es' : ''}
        </Button>
      </div>
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  )
}

function FilterChipButton({
  selected,
  subtleSelected = false,
  onClick,
  disabled = false,
  children,
}: {
  selected: boolean
  subtleSelected?: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  const selectedClass = subtleSelected
    ? 'border-slate-300 bg-slate-50 text-slate-700'
    : 'border-slate-400/70 bg-white text-slate-800'

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-8 items-center rounded-full border px-2.5 text-xs font-normal transition disabled:cursor-not-allowed disabled:opacity-35 ${
        selected
          ? selectedClass
          : 'border-transparent bg-slate-100/70 text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

function PeriodNavigator({
  periods,
  selectedPeriod,
  onPeriodChange,
}: {
  periods: AcademicPeriod[]
  selectedPeriod: AcademicPeriod | undefined
  onPeriodChange: (periodId: string) => void
}) {
  const canGoPrev = Boolean(
    selectedPeriod && getAdjacentPeriodId(periods, selectedPeriod.id, -1),
  )
  const canGoNext = Boolean(
    selectedPeriod && getAdjacentPeriodId(periods, selectedPeriod.id, 1),
  )

  return (
    <div className="rounded-lg border border-slate-200/70 bg-slate-50/40 px-2 py-1.5">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Periodo académico
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canGoPrev || !selectedPeriod}
          onClick={() => {
            if (!selectedPeriod) return
            const prevId = getAdjacentPeriodId(periods, selectedPeriod.id, -1)
            if (prevId) onPeriodChange(prevId)
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/80 disabled:opacity-30"
          aria-label="Período anterior"
        >
          ‹
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-normal text-slate-700">
          {selectedPeriod ? formatAcademicPeriodLabel(selectedPeriod) : 'Sin períodos'}
        </p>
        <button
          type="button"
          disabled={!canGoNext || !selectedPeriod}
          onClick={() => {
            if (!selectedPeriod) return
            const nextId = getAdjacentPeriodId(periods, selectedPeriod.id, 1)
            if (nextId) onPeriodChange(nextId)
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/80 disabled:opacity-30"
          aria-label="Período siguiente"
        >
          ›
        </button>
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
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200/80" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-400/70"
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
        .range-thumb { height: 100%; background: transparent; }
        .range-thumb::-webkit-slider-runnable-track { appearance: none; background: transparent; }
        .range-thumb::-moz-range-track { background: transparent; }
        .range-thumb::-webkit-slider-thumb {
          appearance: none; height: 16px; width: 16px; margin-top: -6px;
          border-radius: 9999px; background: white; border: 1.5px solid #94A3B8;
          box-shadow: none; cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          height: 16px; width: 16px; border-radius: 9999px; background: white;
          border: 1.5px solid #94A3B8; box-shadow: none; cursor: pointer;
        }
      `}</style>
    </div>
  )
}
