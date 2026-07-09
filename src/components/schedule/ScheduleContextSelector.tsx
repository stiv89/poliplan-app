import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ChevronDown, ChevronLeft, Plus, Share2, X } from 'lucide-react'
import type { AcademicPeriod, Career } from '@/types/academic'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { ScheduleContextPanel } from '@/components/schedule/ScheduleContextSheet'
import {
  SchedulePickerPanel,
  type SchedulePickerMode,
  type SchedulePickerPanelProps,
} from '@/components/schedule/SchedulePickerSheet'

export type ScheduleContextView = 'list' | 'create' | 'trash' | 'career-period'

export interface ScheduleContextSelectorProps {
  scheduleName: string
  periodName: string | null
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  schedulePicker: Omit<SchedulePickerPanelProps, 'open' | 'onClose' | 'periodName'>
  /** Desktop popover vs mobile bottom sheet. Defaults to auto via matchMedia. */
  presentation?: 'popover' | 'sheet' | 'auto'
  leading?: ReactNode
  className?: string
  triggerClassName?: string
  onShareSchedule?: () => void
}

export function buildContextPillLabel(
  careerLabel: string | undefined,
  periodName: string | null,
): string {
  if (careerLabel && periodName) return `${careerLabel} · ${periodName}`
  if (careerLabel) return `${careerLabel} · Elegir periodo`
  if (periodName) return `Elegir carrera · ${periodName}`
  return 'Carrera y periodo'
}

export function ScheduleContextSelector({
  scheduleName,
  periodName,
  academicPeriods,
  selectedPeriodId,
  onPeriodChange,
  careers,
  selectedCareerId,
  onCareerChange,
  schedulePicker,
  presentation = 'auto',
  leading,
  className = '',
  triggerClassName = '',
  onShareSchedule,
}: ScheduleContextSelectorProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<ScheduleContextView>('list')
  const [resolvedPresentation, setResolvedPresentation] = useState<'popover' | 'sheet'>(() =>
    presentation === 'auto' ? 'popover' : presentation,
  )

  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (presentation !== 'auto') {
      setResolvedPresentation(presentation)
      return
    }
    const media = window.matchMedia('(min-width: 768px)')
    const sync = () => setResolvedPresentation(media.matches ? 'popover' : 'sheet')
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [presentation])

  useEffect(() => {
    if (!open) setView('list')
  }, [open])

  usePopoverDismiss(
    open && resolvedPresentation === 'popover',
    [buttonRef],
    [popoverRef],
    () => setOpen(false),
  )

  const selectedCareer = careers.find((career) => career.id === selectedCareerId)
  const careerLabel = selectedCareer?.code ?? selectedCareer?.name
  const contextLabel = buildContextPillLabel(careerLabel, periodName)
  const deletedCount = schedulePicker.deletedSchedules.length
  const isSheet = resolvedPresentation === 'sheet'
  const showManage = deletedCount > 0 || schedulePicker.schedules.length > 1

  function close() {
    setOpen(false)
  }

  const panel = (
    <ScheduleContextNavigator
      view={view}
      onViewChange={setView}
      onClose={close}
      contextLabel={contextLabel}
      showManage={showManage}
      deletedCount={deletedCount}
      careers={careers}
      selectedCareerId={selectedCareerId}
      onCareerChange={onCareerChange}
      academicPeriods={academicPeriods}
      selectedPeriodId={selectedPeriodId}
      onPeriodChange={onPeriodChange}
      schedulePicker={schedulePicker}
      periodName={periodName}
      isSheet={isSheet}
    />
  )

  return (
    <div className={`min-w-0 ${className}`} data-tour="career-picker">
      <div className="flex min-w-0 items-start gap-2">
        {leading}
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Tus horarios"
          data-career-picker-trigger
          data-schedule-context-trigger
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`group flex max-w-[300px] min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left transition ${
            open
              ? 'border-slate-300 bg-white shadow-sm'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-slate-50/70'
          } ${triggerClassName}`}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-tight tracking-tight text-slate-800">
              {scheduleName}
            </span>
            <span
              className={`mt-px block truncate text-[11px] leading-snug ${
                selectedCareerId ? 'text-slate-500' : 'font-medium text-primary'
              }`}
            >
              {contextLabel}
            </span>
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:text-slate-500 ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>
        {onShareSchedule && (
          <button
            type="button"
            onClick={onShareSchedule}
            className="inline-flex shrink-0 items-center gap-1.5 self-stretch rounded-lg border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50/70 hover:text-slate-800"
            aria-label="Compartir horario"
          >
            <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Compartir</span>
          </button>
        )}
      </div>

      {isSheet ? (
        open ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />
            <div
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[78dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-xl"
              role="dialog"
              aria-label="Tus horarios"
            >
              {panel}
            </div>
          </>
        ) : null
      ) : (
        <AnimatedPopover
          open={open}
          anchorRef={buttonRef}
          popoverRef={popoverRef}
          align="left"
          offset={6}
          className="flex max-h-[min(26rem,68vh)] w-[min(18.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg"
        >
          {panel}
        </AnimatedPopover>
      )}
    </div>
  )
}

function ScheduleContextNavigator({
  view,
  onViewChange,
  onClose,
  contextLabel: _contextLabel,
  showManage,
  deletedCount,
  careers,
  selectedCareerId,
  onCareerChange,
  academicPeriods,
  selectedPeriodId,
  onPeriodChange,
  schedulePicker,
  periodName,
  isSheet,
}: {
  view: ScheduleContextView
  onViewChange: (view: ScheduleContextView) => void
  onClose: () => void
  contextLabel: string
  showManage: boolean
  deletedCount: number
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  schedulePicker: Omit<SchedulePickerPanelProps, 'open' | 'onClose' | 'periodName'>
  periodName: string | null
  isSheet: boolean
}) {
  const isList = view === 'list'
  const title =
    view === 'list'
      ? 'Tus horarios'
      : view === 'create'
        ? 'Nuevo horario'
        : view === 'trash'
          ? 'Eliminados'
          : 'Carrera y periodo'

  const pickerMode: SchedulePickerMode =
    view === 'create' ? 'create' : view === 'trash' ? 'trash' : 'list'

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${isSheet ? '' : 'max-h-[min(26rem,68vh)]'}`}>
      <div
        className={`relative flex shrink-0 items-center gap-1.5 border-b border-slate-100/80 px-2.5 ${
          isSheet ? 'pb-2.5 pt-3.5' : 'py-2'
        }`}
      >
        {isSheet && (
          <div
            className="absolute left-1/2 top-1.5 h-0.5 w-8 -translate-x-1/2 rounded-full bg-slate-200"
            aria-hidden="true"
          />
        )}

        {!isList ? (
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Volver"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : (
          <span className="w-7 shrink-0" aria-hidden="true" />
        )}

        <p className="min-w-0 flex-1 truncate text-center text-[13px] font-semibold text-text">
          {title}
        </p>

        <div className="flex shrink-0 items-center gap-0.5">
          {isList && (
            <button
              type="button"
              onClick={() => onViewChange('create')}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              aria-label="Crear nuevo horario"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </button>
          )}
          {isSheet && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          {!isSheet && !isList && <span className="w-7" aria-hidden="true" />}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === 'career-period' ? (
          <ScheduleContextPanel
            careers={careers}
            selectedCareerId={selectedCareerId}
            onCareerChange={onCareerChange}
            academicPeriods={academicPeriods}
            selectedPeriodId={selectedPeriodId}
            onPeriodChange={onPeriodChange}
            onPeriodSelected={onClose}
          />
        ) : (
          <SchedulePickerPanel
            {...schedulePicker}
            periodName={periodName}
            open
            embedded
            hideChrome
            initialMode={pickerMode}
            onModeChange={(mode) => {
              if (mode === 'list') onViewChange('list')
              else if (mode === 'create') onViewChange('create')
              else onViewChange('trash')
            }}
            onClose={onClose}
            onRequestCareerPeriod={(scheduleId) => {
              if (scheduleId !== schedulePicker.activeSchedule?.id) {
                schedulePicker.onSelect(scheduleId)
              }
              onViewChange('career-period')
            }}
            onDuplicate={(scheduleId) => {
              const source = schedulePicker.schedules.find((s) => s.id === scheduleId)
              const baseName = source?.name?.trim() || 'Horario'
              schedulePicker.onCreate(`${baseName} (copia)`, scheduleId)
              onClose()
            }}
            onShare={schedulePicker.onShare}
            showManageFooter={isList && showManage}
            manageLabel={
              deletedCount > 0 ? `Administrar horarios · ${deletedCount}` : 'Administrar horarios'
            }
            onManage={() => onViewChange('trash')}
          />
        )}
      </div>
    </div>
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
      // Don't dismiss when interacting with nested schedule item menus (also portaled).
      if ((event.target as HTMLElement).closest?.('[data-schedule-menu]')) return
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
