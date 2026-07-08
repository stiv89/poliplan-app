import { useEffect, useRef, useState, type RefObject } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { AcademicPeriod, Career } from '@/types/academic'
import {
  SchedulePickerMenu,
  type SchedulePickerPanelProps,
} from '@/components/schedule/SchedulePickerSheet'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
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
  const careerButtonRef = useRef<HTMLButtonElement>(null)
  const periodButtonRef = useRef<HTMLButtonElement>(null)
  const careerPopoverRef = useRef<HTMLDivElement>(null)
  const periodPopoverRef = useRef<HTMLDivElement>(null)

  usePopoverDismiss(openMenu, [careerButtonRef, periodButtonRef], [careerPopoverRef, periodPopoverRef], () =>
    setOpenMenu(null),
  )

  const selectedCareer = careers.find((career) => career.id === selectedCareerId)
  const sortedPeriods = sortAcademicPeriods(academicPeriods)

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex min-w-0 max-w-full items-stretch overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex min-w-0 items-center bg-white px-3 py-1.5">
            <SchedulePickerMenu
              scheduleName={scheduleName}
              embedded
              titleClassName={titleClassName ?? 'text-sm'}
              {...schedulePicker}
              periodName={null}
            />
          </div>

          <div className="flex min-w-0 items-stretch border-l border-slate-200/80 bg-slate-100/90">
            <ContextSegmentButton
              buttonRef={careerButtonRef}
              label={selectedCareer?.code ?? selectedCareer?.name ?? 'Carrera'}
              open={openMenu === 'career'}
              onClick={() => setOpenMenu((value) => (value === 'career' ? null : 'career'))}
              ariaLabel="Elegir carrera"
            />

            {periodName && (
              <>
                <span className="w-px self-stretch bg-slate-200/70" aria-hidden="true" />
                <ContextSegmentButton
                  buttonRef={periodButtonRef}
                  label={periodName}
                  open={openMenu === 'period'}
                  onClick={() => setOpenMenu((value) => (value === 'period' ? null : 'period'))}
                  ariaLabel="Elegir periodo académico"
                  className="max-w-[9.5rem] sm:max-w-[11rem]"
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
        className="max-h-[min(18rem,50vh)] w-[min(16rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg"
      >
        <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          Carrera
        </p>
        <ul role="listbox" aria-label="Carreras">
          {careers.map((career) => {
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
                  {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
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
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
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

function ContextSegmentButton({
  buttonRef,
  label,
  open,
  onClick,
  ariaLabel,
  className = '',
}: {
  buttonRef: RefObject<HTMLButtonElement | null>
  label: string
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
      className={`inline-flex h-8 min-w-0 items-center gap-1 px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200/50 ${className}`}
    >
      <span className="truncate">{label}</span>
      <ChevronDown
        className={`h-3 w-3 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
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
