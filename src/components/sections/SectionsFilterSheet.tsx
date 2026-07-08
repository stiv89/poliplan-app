import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { SCHEDULE_FILTER_CONFIG } from '@/config/scheduleFilters'
import { DEFAULT_SCHEDULE_VIEW_FILTERS, type ScheduleViewFilters } from '@/types/scheduleFilters'
import {
  formatFilterTimeLabel,
  isScheduleViewFiltersActive,
  sectionMatchesViewFilters,
} from '@/utils/scheduleFilters'

const SHIFT_OPTIONS = ['Mañana', 'Tarde', 'Noche'] as const

export interface SectionsExtraFilters {
  shift: string | null
  teacherQuery: string
  hideConflicting: boolean
  onlyUnselected: boolean
}

export const DEFAULT_SECTIONS_EXTRA_FILTERS: SectionsExtraFilters = {
  shift: null,
  teacherQuery: '',
  hideConflicting: false,
  onlyUnselected: false,
}

export function isSectionsFiltersActive(
  viewFilters: ScheduleViewFilters,
  extra: SectionsExtraFilters,
): boolean {
  return (
    isScheduleViewFiltersActive(viewFilters) ||
    extra.shift !== null ||
    extra.teacherQuery.trim().length > 0 ||
    extra.hideConflicting ||
    extra.onlyUnselected
  )
}

interface SectionsFilterControlsProps {
  viewFilters: ScheduleViewFilters
  extraFilters: SectionsExtraFilters
  onViewFiltersChange: (filters: ScheduleViewFilters) => void
  onExtraFiltersChange: (filters: SectionsExtraFilters) => void
}

function SectionsFilterControls({
  viewFilters,
  extraFilters,
  onViewFiltersChange,
  onExtraFiltersChange,
}: SectionsFilterControlsProps) {
  const { minMinutes, maxMinutes, stepMinutes } = SCHEDULE_FILTER_CONFIG.timeRange

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
          Turno
        </p>
        <div className="flex flex-wrap gap-1.5">
          <FilterPill
            label="Todos"
            active={extraFilters.shift === null}
            onClick={() => onExtraFiltersChange({ ...extraFilters, shift: null })}
          />
          {SHIFT_OPTIONS.map((shift) => (
            <FilterPill
              key={shift}
              label={shift}
              active={extraFilters.shift === shift}
              onClick={() =>
                onExtraFiltersChange({
                  ...extraFilters,
                  shift: extraFilters.shift === shift ? null : shift,
                })
              }
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
          Días
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SCHEDULE_FILTER_CONFIG.availableDays.map((day) => {
            const active = viewFilters.days.includes(day)
            const label = SCHEDULE_FILTER_CONFIG.dayLabels[day] ?? String(day)
            return (
              <FilterPill
                key={day}
                label={label}
                active={active}
                onClick={() => {
                  const days = active
                    ? viewFilters.days.filter((value) => value !== day)
                    : [...viewFilters.days, day].sort((a, b) => a - b)
                  onViewFiltersChange({ ...viewFilters, days })
                }}
              />
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-text">
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
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted">
          Docente
        </label>
        <input
          type="search"
          value={extraFilters.teacherQuery}
          onChange={(event) =>
            onExtraFiltersChange({ ...extraFilters, teacherQuery: event.target.value })
          }
          placeholder="Buscar por nombre…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-light"
        />
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <FilterCheckbox
          label="Sin conflictos"
          description="Oculta secciones que chocan con tu horario."
          checked={extraFilters.hideConflicting}
          onChange={(checked) =>
            onExtraFiltersChange({ ...extraFilters, hideConflicting: checked })
          }
        />
        <FilterCheckbox
          label="Solo sin agregar"
          description="Muestra únicamente secciones que aún no elegiste."
          checked={extraFilters.onlyUnselected}
          onChange={(checked) =>
            onExtraFiltersChange({ ...extraFilters, onlyUnselected: checked })
          }
        />
      </div>

      <button
        type="button"
        onClick={() => {
          onViewFiltersChange(DEFAULT_SCHEDULE_VIEW_FILTERS)
          onExtraFiltersChange(DEFAULT_SECTIONS_EXTRA_FILTERS)
        }}
        className="text-xs text-muted transition hover:text-text"
      >
        Restablecer filtros
      </button>
    </div>
  )
}

export function SectionsFilterMenu({
  viewFilters,
  extraFilters,
  onViewFiltersChange,
  onExtraFiltersChange,
}: SectionsFilterControlsProps) {
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const active = isSectionsFiltersActive(viewFilters, extraFilters)

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

  const controls = (
    <SectionsFilterControls
      viewFilters={viewFilters}
      extraFilters={extraFilters}
      onViewFiltersChange={onViewFiltersChange}
      onExtraFiltersChange={onExtraFiltersChange}
    />
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (window.matchMedia('(min-width: 768px)').matches) {
            setOpen((value) => !value)
          } else {
            setMobileOpen(true)
          }
        }}
        className={`relative flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition ${
          open || mobileOpen || active
            ? 'border-primary/30 bg-primary/5 text-primary'
            : 'border-slate-200 bg-white text-muted hover:bg-slate-50'
        }`}
        aria-label="Filtros"
        aria-expanded={open || mobileOpen}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Filtros</span>
        {active && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        )}
      </button>

      <AnimatedPopover
        open={open}
        anchorRef={buttonRef}
        popoverRef={popoverRef}
        align="right"
        className="hidden w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl md:block"
      >
        {controls}
      </AnimatedPopover>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:hidden"
            role="dialog"
            aria-label="Filtros"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-text">Filtros</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">{controls}</div>
            <div className="shrink-0 border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export { sectionMatchesViewFilters }

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
        active ? 'bg-primary text-white' : 'bg-slate-100 text-muted hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function FilterCheckbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm text-text">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
    </label>
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
        .range-thumb { height: 100%; background: transparent; }
        .range-thumb::-webkit-slider-runnable-track { appearance: none; background: transparent; }
        .range-thumb::-moz-range-track { background: transparent; }
        .range-thumb::-webkit-slider-thumb {
          appearance: none; height: 18px; width: 18px; margin-top: -7px;
          border-radius: 9999px; background: white; border: 2px solid #0B3B8F;
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.15); cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          height: 18px; width: 18px; border-radius: 9999px; background: white;
          border: 2px solid #0B3B8F; box-shadow: 0 1px 3px rgb(0 0 0 / 0.15); cursor: pointer;
        }
      `}</style>
    </div>
  )
}
