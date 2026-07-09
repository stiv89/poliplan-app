import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import type { AcademicPeriod, Career } from '@/types/academic'
import {
  SchedulePickerPanel,
  type SchedulePickerPanelProps,
} from '@/components/schedule/SchedulePickerSheet'
import { filterAndRankByFuzzySearch } from '@/utils/fuzzySearch'
import { formatAcademicPeriodLabel, sortAcademicPeriods } from '@/utils/scheduleFilters'

export interface ScheduleContextPanelProps {
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  onPeriodSelected?: () => void
}

export function ScheduleContextPanel({
  careers,
  selectedCareerId,
  onCareerChange,
  academicPeriods,
  selectedPeriodId,
  onPeriodChange,
  onPeriodSelected,
}: ScheduleContextPanelProps) {
  const [careerSearch, setCareerSearch] = useState('')
  const careerSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      careerSearchRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const sortedPeriods = sortAcademicPeriods(academicPeriods)
  const filteredCareers = useMemo(
    () =>
      filterAndRankByFuzzySearch(careers, careerSearch, (career) =>
        buildCareerSearchText(career),
      ),
    [careers, careerSearch],
  )

  return (
    <div className="flex flex-col">
      <div className="shrink-0 px-4 pb-3 pt-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Carrera</p>
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            ref={careerSearchRef}
            type="search"
            value={careerSearch}
            onChange={(event) => setCareerSearch(event.target.value)}
            placeholder="Buscar carrera…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3 text-sm text-text placeholder:text-muted focus:border-primary-light focus:bg-white focus:outline-none"
            aria-label="Buscar carrera"
          />
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto border-b border-slate-100 px-2 pb-2">
        {filteredCareers.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted">
            {careerSearch.trim()
              ? `Sin resultados para "${careerSearch.trim()}"`
              : 'No hay carreras disponibles'}
          </p>
        ) : (
          <ul role="listbox" aria-label="Carreras">
            {filteredCareers.map((career) => {
              const selected = career.id === selectedCareerId
              return (
                <li key={career.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => onCareerChange(career.id)}
                    className={`flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                      selected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-text">
                        {career.code ?? career.name}
                      </span>
                      {career.code && (
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {career.name}
                        </span>
                      )}
                    </span>
                    {selected && (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="px-2 py-2">
        <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          Periodo académico
        </p>
        <ul role="listbox" aria-label="Periodos académicos" className="max-h-48 overflow-y-auto">
          {sortedPeriods.map((period) => {
            const selected = period.id === selectedPeriodId
            return (
              <li key={period.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onPeriodChange(period.id)
                    onPeriodSelected?.()
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                    selected ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text">
                      {formatAcademicPeriodLabel(period)}
                    </span>
                    {period.isActive && (
                      <span className="mt-0.5 block text-[11px] text-muted">Activo</span>
                    )}
                  </span>
                  {selected && (
                    <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

interface ScheduleContextSheetProps extends ScheduleContextPanelProps {
  open: boolean
  onClose: () => void
  showSchedulePicker?: boolean
  schedulePicker?: Omit<SchedulePickerPanelProps, 'open' | 'onClose' | 'periodName'>
  periodName?: string | null
}

export function ScheduleContextSheet({
  open,
  onClose,
  showSchedulePicker = false,
  schedulePicker,
  periodName = null,
  onPeriodChange,
  ...panelProps
}: ScheduleContextSheetProps) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl"
        role="dialog"
        aria-label="Carrera y periodo"
      >
        <div className="relative flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <div
            className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold text-text">Carrera y periodo</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 text-muted" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {showSchedulePicker && schedulePicker && (
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                Mi horario
              </p>
              <SchedulePickerPanel
                {...schedulePicker}
                periodName={periodName}
                open
                embedded
                onClose={onClose}
              />
            </div>
          )}

          <ScheduleContextPanel
            {...panelProps}
            onPeriodChange={onPeriodChange}
            onPeriodSelected={onClose}
          />
        </div>
      </div>
    </>
  )
}

function buildCareerSearchText(career: Career): string {
  return [career.code, career.name, career.faculty, career.campus].filter(Boolean).join(' ')
}
