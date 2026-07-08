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

type OpenMenu = 'career' | 'period' | null

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
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [careerSearch, setCareerSearch] = useState('')
  const careerButtonRef = useRef<HTMLButtonElement>(null)
  const periodButtonRef = useRef<HTMLButtonElement>(null)
  const careerPopoverRef = useRef<HTMLDivElement>(null)
  const periodPopoverRef = useRef<HTMLDivElement>(null)
  const careerSearchRef = useRef<HTMLInputElement>(null)

  usePopoverDismiss(openMenu, [careerButtonRef, periodButtonRef], [careerPopoverRef, periodPopoverRef], () =>
    setOpenMenu(null),
  )

  useEffect(() => {
    if (openMenu === 'career') {
      const frame = requestAnimationFrame(() => {
        careerSearchRef.current?.focus()
      })
      return () => cancelAnimationFrame(frame)
    }

    setCareerSearch('')
  }, [openMenu])

  const selectedCareer = careers.find((career) => career.id === selectedCareerId)
  const sortedPeriods = sortAcademicPeriods(academicPeriods)
  const filteredCareers = useMemo(
    () =>
      filterAndRankByFuzzySearch(careers, careerSearch, (career) =>
        buildCareerSearchText(career),
      ),
    [careers, careerSearch],
  )

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex min-h-10 min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm">
          <SchedulePickerMenu
            scheduleName={scheduleName}
            embedded
            embeddedCapsule
            titleClassName={titleClassName ?? 'text-[15px]'}
            {...schedulePicker}
            periodName={null}
          />

          <span
            className="shrink-0 select-none text-sm font-normal leading-none text-slate-300"
            aria-hidden="true"
          >
            ›
          </span>

          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0">
            <ContextInlineSelect
              buttonRef={careerButtonRef}
              label="Carrera"
              value={selectedCareer?.code ?? selectedCareer?.name ?? 'Elegir'}
              open={openMenu === 'career'}
              onClick={() => setOpenMenu((value) => (value === 'career' ? null : 'career'))}
              ariaLabel="Elegir carrera del horario activo"
            />

            {periodName && (
              <>
                <span className="select-none px-0.5 text-xs leading-none text-slate-300" aria-hidden="true">
                  ·
                </span>
                <ContextInlineSelect
                  buttonRef={periodButtonRef}
                  label="Periodo"
                  value={periodName}
                  open={openMenu === 'period'}
                  onClick={() => setOpenMenu((value) => (value === 'period' ? null : 'period'))}
                  ariaLabel="Elegir periodo del horario activo"
                  className="min-w-0 max-w-full sm:max-w-[10.5rem]"
                />
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatedPopover
        open={openMenu === 'career'}
        anchorRef={careerButtonRef}
        popoverRef={careerPopoverRef}
        align="left"
        className="flex max-h-[min(20rem,55vh)] w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-lg"
      >
        <div className="shrink-0 border-b border-slate-100 px-2.5 py-2">
          <p className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
            Carrera
          </p>
          <div className="relative">
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
                  setOpenMenu(null)
                }
              }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {filteredCareers.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted">
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
                      onClick={() => {
                        onCareerChange(career.id)
                        setOpenMenu(null)
                      }}
                      className={`flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-slate-50 ${
                        selected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-text">
                          {career.code ?? career.name}
                        </span>
                        {career.code && (
                          <span className="mt-0.5 block truncate text-xs text-muted">{career.name}</span>
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
      </AnimatedPopover>

      <AnimatedPopover
        open={openMenu === 'period'}
        anchorRef={periodButtonRef}
        popoverRef={periodPopoverRef}
        align="left"
        className="w-[min(17rem,calc(100vw-2rem))] rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg"
      >
        <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          Periodo académico
        </p>
        <ul role="listbox" aria-label="Periodos académicos">
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
                    setOpenMenu(null)
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
                  {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      </AnimatedPopover>

      {scheduleCareers.length > 1 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted/80">
            En tu horario
          </span>
          {scheduleCareers.map((career) => {
            const active = career.id === selectedCareerId
            return (
              <button
                key={career.id}
                type="button"
                onClick={() => onCareerChange(career.id)}
                aria-pressed={active}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                  active
                    ? 'bg-primary-light text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

function ContextInlineSelect({
  buttonRef,
  label,
  value,
  open,
  onClick,
  ariaLabel,
  className = '',
}: {
  buttonRef: RefObject<HTMLButtonElement | null>
  label: string
  value: string
  open: boolean
  onClick: () => void
  ariaLabel: string
  className?: string
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-haspopup="listbox"
      className={`group inline-flex min-w-0 max-w-full items-center gap-0.5 rounded-sm px-0.5 py-0.5 text-left transition ${className}`}
    >
      <span className="shrink-0 text-[10px] font-medium leading-none text-slate-400">
        {label}:
      </span>
      <span className="inline-flex min-w-0 items-center gap-0.5 text-[13px] font-medium leading-tight text-slate-600 transition group-hover:text-slate-800">
        <span className="truncate">{value}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-slate-400 transition-transform group-hover:text-slate-500 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </span>
    </button>
  )
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
