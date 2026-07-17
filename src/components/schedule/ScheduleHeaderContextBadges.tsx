import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Check } from 'lucide-react'
import type { AcademicPeriod, Career } from '@/types/academic'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { filterAndRankByFuzzySearch } from '@/utils/fuzzySearch'
import {
  formatCareerCompactLabel,
  formatCareerDisplayLabel,
  formatCompactPeriodLabel,
  formatCompactPeriodShortLabel,
} from '@/utils/scheduleHeader'
import { sortAcademicPeriods } from '@/utils/scheduleFilters'

type PickerKind = 'career' | 'period'

interface ScheduleHeaderContextBadgesProps {
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  compact?: boolean
}

export function ScheduleHeaderContextBadges({
  careers,
  selectedCareerId,
  onCareerChange,
  academicPeriods,
  selectedPeriodId,
  onPeriodChange,
  compact = false,
}: ScheduleHeaderContextBadgesProps) {
  const [openPicker, setOpenPicker] = useState<PickerKind | null>(null)
  const [careerSearch, setCareerSearch] = useState('')

  const careerBadgeRef = useRef<HTMLButtonElement>(null)
  const periodBadgeRef = useRef<HTMLButtonElement>(null)
  const careerPopoverRef = useRef<HTMLDivElement>(null)
  const periodPopoverRef = useRef<HTMLDivElement>(null)

  const selectedCareer = careers.find((career) => career.id === selectedCareerId) ?? null
  const selectedPeriod =
    academicPeriods.find((period) => period.id === selectedPeriodId) ?? null

  const careerLabel = compact
    ? formatCareerCompactLabel(selectedCareer)
    : formatCareerDisplayLabel(selectedCareer)
  const careerAriaLabel = formatCareerDisplayLabel(selectedCareer)
  const periodLabel = selectedPeriod
    ? compact
      ? formatCompactPeriodShortLabel(selectedPeriod)
      : formatCompactPeriodLabel(selectedPeriod)
    : 'Periodo'

  const sortedPeriods = useMemo(
    () => sortAcademicPeriods(academicPeriods),
    [academicPeriods],
  )

  const filteredCareers = useMemo(
    () =>
      filterAndRankByFuzzySearch(careers, careerSearch, (career) =>
        [career.code, career.name, career.faculty].filter(Boolean).join(' '),
      ),
    [careers, careerSearch],
  )

  useEffect(() => {
    if (openPicker !== 'career') setCareerSearch('')
  }, [openPicker])

  useHeaderBadgeDismiss(
    openPicker === 'career',
    [careerBadgeRef],
    [careerPopoverRef],
    () => setOpenPicker(null),
  )

  useHeaderBadgeDismiss(
    openPicker === 'period',
    [periodBadgeRef],
    [periodPopoverRef],
    () => setOpenPicker(null),
  )

  function togglePicker(kind: PickerKind) {
    setOpenPicker((current) => (current === kind ? null : kind))
  }

  return (
    <div
      className={`schedule-header-badges ${compact ? 'schedule-header-badges--compact' : ''}`}
      aria-label={`${careerAriaLabel}, ${periodLabel}`}
    >
      <button
        ref={careerBadgeRef}
        type="button"
        onClick={() => togglePicker('career')}
        aria-expanded={openPicker === 'career'}
        aria-haspopup="listbox"
        aria-label={selectedCareer ? `Carrera: ${careerAriaLabel}` : 'Elegir carrera'}
        title={careerAriaLabel}
        className={`schedule-header-badge schedule-header-badge--career ${
          selectedCareer
            ? 'schedule-header-badge--selected'
            : 'schedule-header-badge--empty'
        } ${openPicker === 'career' ? 'schedule-header-badge--open' : ''}`}
      >
        <span className="truncate">{careerLabel}</span>
      </button>

      <button
        ref={periodBadgeRef}
        type="button"
        onClick={() => togglePicker('period')}
        aria-expanded={openPicker === 'period'}
        aria-haspopup="listbox"
        className={`schedule-header-badge ${
          selectedPeriod
            ? 'schedule-header-badge--selected'
            : 'schedule-header-badge--empty'
        } ${openPicker === 'period' ? 'schedule-header-badge--open' : ''}`}
      >
        <span className="truncate">{periodLabel}</span>
      </button>

      <AnimatedPopover
        open={openPicker === 'career'}
        anchorRef={careerBadgeRef}
        popoverRef={careerPopoverRef}
        align="left"
        offset={6}
        className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg"
      >
        <div className="border-b border-slate-100 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Carrera
          </p>
          {careers.length > 6 && (
            <input
              type="search"
              value={careerSearch}
              onChange={(event) => setCareerSearch(event.target.value)}
              placeholder="Buscar…"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-sm text-text placeholder:text-muted focus:border-primary-light focus:bg-white focus:outline-none"
              aria-label="Buscar carrera"
            />
          )}
        </div>
        <ul
          role="listbox"
          aria-label="Carreras"
          className="max-h-56 overflow-y-auto p-1.5"
        >
          {filteredCareers.length === 0 ? (
            <li className="px-2 py-3 text-center text-xs text-muted">Sin resultados</li>
          ) : (
            filteredCareers.map((career) => {
              const selected = career.id === selectedCareerId
              return (
                <li key={career.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onCareerChange(career.id)
                      setOpenPicker(null)
                    }}
                    className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-50 ${
                      selected ? 'bg-primary/5 text-primary' : 'text-text'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {career.code?.trim() || career.name}
                      </span>
                      {career.code?.trim() &&
                        career.name?.trim() &&
                        career.code.trim().localeCompare(career.name.trim(), undefined, {
                          sensitivity: 'accent',
                        }) !== 0 && (
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {career.name}
                          </span>
                        )}
                    </span>
                    {selected && (
                      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </AnimatedPopover>

      <AnimatedPopover
        open={openPicker === 'period'}
        anchorRef={periodBadgeRef}
        popoverRef={periodPopoverRef}
        align="left"
        offset={6}
        className="w-[min(17rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg"
      >
        <div className="border-b border-slate-100 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Periodo
          </p>
        </div>
        <ul
          role="listbox"
          aria-label="Periodos académicos"
          className="max-h-56 overflow-y-auto p-1.5"
        >
          {sortedPeriods.length === 0 ? (
            <li className="px-2 py-3 text-center text-xs text-muted">Sin periodos</li>
          ) : (
            sortedPeriods.map((period) => {
              const selected = period.id === selectedPeriodId
              return (
                <li key={period.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onPeriodChange(period.id)
                      setOpenPicker(null)
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-slate-50 ${
                      selected ? 'bg-primary/5 text-primary' : 'text-text'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {formatCompactPeriodLabel(period)}
                    </span>
                    {selected && (
                      <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </AnimatedPopover>
    </div>
  )
}

function useHeaderBadgeDismiss(
  open: boolean,
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
