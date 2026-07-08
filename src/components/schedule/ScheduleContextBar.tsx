import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import type { AcademicPeriod, Career } from '@/types/academic'
import {
  SchedulePickerMenu,
  type SchedulePickerPanelProps,
} from '@/components/schedule/SchedulePickerSheet'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { filterAndRankByFuzzySearch } from '@/utils/fuzzySearch'
import { formatAcademicPeriodLabel, sortAcademicPeriods } from '@/utils/scheduleFilters'

interface ScheduleContextBarProps {
  scheduleName: string
  periodName: string | null
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  scheduleCareers: Career[]
  schedulePicker: Omit<SchedulePickerPanelProps, 'open' | 'onClose' | 'periodName'>
  titleClassName?: string
}

const SELECTABLE_PILL_BASE =
  'inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50/90 active:bg-slate-100/70'

function selectablePillClass(open: boolean): string {
  return `${SELECTABLE_PILL_BASE} ${
    open
      ? 'border-slate-300 bg-slate-50 ring-1 ring-slate-200/70'
      : 'border-slate-200/90'
  }`
}

export function ScheduleContextBar({
  scheduleName,
  periodName,
  academicPeriods,
  selectedPeriodId,
  onPeriodChange,
  careers,
  selectedCareerId,
  onCareerChange,
  scheduleCareers,
  schedulePicker,
  titleClassName,
}: ScheduleContextBarProps) {
  const [contextOpen, setContextOpen] = useState(false)
  const [careerSearch, setCareerSearch] = useState('')
  const contextButtonRef = useRef<HTMLButtonElement>(null)
  const contextPopoverRef = useRef<HTMLDivElement>(null)
  const careerSearchRef = useRef<HTMLInputElement>(null)

  usePopoverDismiss(contextOpen, [contextButtonRef], [contextPopoverRef], () =>
    setContextOpen(false),
  )

  useEffect(() => {
    if (!contextOpen) {
      setCareerSearch('')
      return
    }

    const frame = requestAnimationFrame(() => {
      careerSearchRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [contextOpen])

  const selectedCareer = careers.find((career) => career.id === selectedCareerId)
  const sortedPeriods = sortAcademicPeriods(academicPeriods)
  const filteredCareers = useMemo(
    () =>
      filterAndRankByFuzzySearch(careers, careerSearch, (career) =>
        buildCareerSearchText(career),
      ),
    [careers, careerSearch],
  )

  const careerLabel = selectedCareer?.code ?? selectedCareer?.name
  const contextPillLabel = buildContextPillLabel(careerLabel, periodName)

  return (
    <div className="min-w-0 flex-1" data-tour="career-picker">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SchedulePickerMenu
          scheduleName={scheduleName}
          embedded
          pill
          titleClassName={titleClassName ?? 'text-sm'}
          {...schedulePicker}
          periodName={null}
        />

        <button
          ref={contextButtonRef}
          type="button"
          onClick={() => setContextOpen((value) => !value)}
          aria-label="Elegir carrera y periodo académico"
          aria-expanded={contextOpen}
          aria-haspopup="dialog"
          className={`group ${selectablePillClass(contextOpen)}`}
        >
          <span
            className={`truncate text-sm leading-tight ${
              selectedCareerId ? 'font-normal text-slate-600' : 'font-medium text-primary'
            }`}
          >
            {contextPillLabel}
          </span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-slate-400 transition-transform group-hover:text-slate-500 ${contextOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <AnimatedPopover
        open={contextOpen}
        anchorRef={contextButtonRef}
        popoverRef={contextPopoverRef}
        align="left"
        className="flex max-h-[min(26rem,62vh)] w-[min(19rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-lg"
      >
        <div className="shrink-0 border-b border-slate-100 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">Carrera</p>
          <div className="relative mt-1.5">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              ref={careerSearchRef}
              type="search"
              value={careerSearch}
              onChange={(event) => setCareerSearch(event.target.value)}
              placeholder="Buscar carrera…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-8 pr-2.5 text-sm text-text placeholder:text-muted focus:border-primary-light focus:bg-white focus:outline-none"
              aria-label="Buscar carrera"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.stopPropagation()
                  setContextOpen(false)
                }
              }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {filteredCareers.length === 0 ? (
            <p className="px-3 py-3 text-center text-sm text-muted">
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
                      className={`flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-slate-50 ${
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

        <div className="shrink-0 border-t border-slate-100 py-1">
          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            Periodo académico
          </p>
          <ul role="listbox" aria-label="Periodos académicos" className="max-h-40 overflow-y-auto">
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
                      setContextOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-50 ${
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
      </AnimatedPopover>

      {scheduleCareers.length > 1 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-muted/70">En tu horario</span>
          {scheduleCareers.map((career) => {
            const active = career.id === selectedCareerId
            return (
              <button
                key={career.id}
                type="button"
                onClick={() => onCareerChange(career.id)}
                aria-pressed={active}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                  active
                    ? 'border-slate-300 bg-slate-100 text-slate-700'
                    : 'border-transparent bg-slate-100/80 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                }`}
              >
                {career.code ?? career.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function buildContextPillLabel(
  careerLabel: string | undefined,
  periodName: string | null,
): string {
  if (careerLabel && periodName) return `${careerLabel} · ${periodName}`
  if (careerLabel) return `${careerLabel} · Elegir periodo`
  if (periodName) return `Elegir carrera · ${periodName}`
  return 'Carrera y periodo'
}

function usePopoverDismiss(
  open: unknown,
  anchorRefs: RefObject<HTMLElement | null>[],
  popoverRefs: RefObject<HTMLElement | null>[],
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        anchorRefs.some((ref) => ref.current?.contains(target)) ||
        popoverRefs.some((ref) => ref.current?.contains(target))
      ) {
        return
      }
      onClose()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, anchorRefs, popoverRefs, onClose])
}

function buildCareerSearchText(career: Career): string {
  return [career.code, career.name, career.faculty, career.campus].filter(Boolean).join(' ')
}
