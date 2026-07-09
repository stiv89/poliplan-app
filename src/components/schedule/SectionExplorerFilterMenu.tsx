import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { Button } from '@/components/ui/Button'
import type { AcademicPeriod } from '@/types/academic'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import {
  formatAcademicPeriodLabel,
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
import {
  DualRangeSlider,
  ExplorerFilterChip,
  ExplorerFilterSection,
} from '@/components/schedule/sectionExplorerFilterParts'
import { formatFilterTimeLabel } from '@/utils/scheduleFilters'

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
  /** Mobile: open filters in a bottom sheet instead of a popover */
  presentation?: 'popover' | 'sheet'
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
  presentation = 'popover',
}: SectionExplorerFilterMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const isSheet = presentation === 'sheet'

  const activeCount = countSectionExplorerFilters({
    semesterFilter,
    shiftFilter,
    viewFilters,
  })

  useEffect(() => {
    if (!open || isSheet) return

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
  }, [open, isSheet])

  function handleClear() {
    clearSectionExplorerFilters(
      onSemesterFilterChange,
      onShiftFilterChange,
      onViewFiltersChange,
    )
  }

  const filterPanel = (
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
      showPeriod={presentation === 'popover'}
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

      {isSheet ? (
        open ? (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl"
              role="dialog"
              aria-label="Filtros"
            >
              <div className="relative flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
                <div
                  className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-text">Filtros</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-slate-100"
                  aria-label="Cerrar filtros"
                >
                  <X className="h-4 w-4 text-muted" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {filterPanel}
              </div>
            </div>
          </>
        ) : null
      ) : (
        <AnimatedPopover
          open={open}
          anchorRef={buttonRef}
          popoverRef={popoverRef}
          align={align}
          className="w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          {filterPanel}
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
  showPeriod = true,
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
  showPeriod?: boolean
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
      {sortedPeriods.length > 0 && showPeriod && (
        <PeriodNavigator
          periods={sortedPeriods}
          selectedPeriod={selectedPeriod}
          onPeriodChange={onPeriodChange}
        />
      )}

      <ExplorerFilterSection title="Semestre">
        <div className="flex flex-wrap gap-1.5">
          <ExplorerFilterChip
            selected={semesterFilter == null}
            onClick={() => onSemesterFilterChange(null)}
          >
            Todos
          </ExplorerFilterChip>
          {semesterOptions().map((semester) => (
            <ExplorerFilterChip
              key={semester}
              selected={semesterFilter === semester}
              onClick={() => onSemesterFilterChange(semester)}
              disabled={!availableSemesterSet.has(semester)}
            >
              {semester}.º
            </ExplorerFilterChip>
          ))}
        </div>
      </ExplorerFilterSection>

      <ExplorerFilterSection title="Turno">
        <div className="flex flex-wrap gap-1.5">
          <ExplorerFilterChip
            selected={shiftFilter == null}
            onClick={() => onShiftFilterChange(null)}
          >
            Todos
          </ExplorerFilterChip>
          {EXPLORER_SHIFT_OPTIONS.map((shift) => (
            <ExplorerFilterChip
              key={shift}
              selected={shiftFilter === shift}
              onClick={() => onShiftFilterChange(shift)}
            >
              {shift}
            </ExplorerFilterChip>
          ))}
        </div>
      </ExplorerFilterSection>

      <ExplorerFilterSection title="Días">
        <div className="flex flex-wrap gap-1.5">
          {SCHEDULE_FILTER_CONFIG.availableDays.map((day) => {
            const active = viewFilters.days.includes(day)
            const label = SCHEDULE_FILTER_CONFIG.dayLabels[day] ?? String(day)
            return (
              <ExplorerFilterChip
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
              </ExplorerFilterChip>
            )
          })}
        </div>
      </ExplorerFilterSection>

      <ExplorerFilterSection title="Horario visible">
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
      </ExplorerFilterSection>

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
