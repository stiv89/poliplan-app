import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ChevronDown, ChevronLeft, Plus, Share2, X } from 'lucide-react'
import type { AcademicPeriod, Career } from '@/types/academic'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ShareSchedulePopover } from '@/components/schedule/ShareSchedulePopover'
import { ScheduleHeaderContextBadges } from '@/components/schedule/ScheduleHeaderContextBadges'
import { ScheduleContextPanel } from '@/components/schedule/ScheduleContextSheet'
import { formatScheduleHeaderTitle } from '@/utils/scheduleHeader'
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
  onShareSchedule?: () => Promise<string>
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
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [view, setView] = useState<ScheduleContextView>('list')
  const [shareAnimated, setShareAnimated] = useState(false)
  const [resolvedPresentation, setResolvedPresentation] = useState<'popover' | 'sheet'>(() =>
    presentation === 'auto' ? 'popover' : presentation,
  )

  const chevronRef = useRef<HTMLButtonElement>(null)
  const shareRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const sharePopoverRef = useRef<HTMLDivElement>(null)

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
    [chevronRef],
    [popoverRef],
    () => setOpen(false),
  )

  usePopoverDismiss(
    shareOpen,
    [shareRef],
    [sharePopoverRef],
    () => setShareOpen(false),
  )

  const selectedCareer = careers.find((career) => career.id === selectedCareerId)
  const headerTitle = formatScheduleHeaderTitle(scheduleName)
  const contextLabel = buildContextPillLabel(
    selectedCareer?.code ?? selectedCareer?.name,
    periodName,
  )
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

  function closeShare() {
    setShareOpen(false)
  }

  async function handleShareClick() {
    if (!onShareSchedule) return

    if (shareOpen) {
      closeShare()
      return
    }

    setShareAnimated(false)
    window.requestAnimationFrame(() => setShareAnimated(true))
    window.setTimeout(() => setShareAnimated(false), 450)

    setShareOpen(true)
    setShareUrl(null)
    setShareLoading(true)

    try {
      const url = await onShareSchedule()
      setShareUrl(url)
    } catch {
      setShareOpen(false)
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className={`min-w-0 ${className}`} data-tour="career-picker">
      <div
        className={`flex min-w-0 justify-between gap-2 ${
          isSheet ? 'items-center schedule-header-row--compact' : 'items-start gap-3'
        }`}
      >
        {leading}
        <div className={`min-w-0 flex-1 ${triggerClassName}`}>
          <h1 className="schedule-header-title truncate">{headerTitle}</h1>
          <ScheduleHeaderContextBadges
            careers={careers}
            selectedCareerId={selectedCareerId}
            onCareerChange={onCareerChange}
            academicPeriods={academicPeriods}
            selectedPeriodId={selectedPeriodId}
            onPeriodChange={onPeriodChange}
            compact={isSheet}
          />
        </div>

        <div
          className={`schedule-header-actions flex shrink-0 items-center ${
            isSheet ? 'gap-1.5' : 'gap-2 pt-0.5'
          }`}
        >
          <button
            ref={chevronRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Tus horarios"
            data-career-picker-trigger
            data-schedule-context-trigger
            aria-expanded={open}
            aria-haspopup="dialog"
            className={`schedule-header-circle-btn ${
              isSheet ? 'schedule-header-circle-btn--compact' : ''
            }`}
          >
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {onShareSchedule && (
            <button
              ref={shareRef}
              type="button"
              onClick={() => void handleShareClick()}
              className={`schedule-header-share-btn group ${
                isSheet ? 'schedule-header-share-btn--compact' : ''
              } ${shareAnimated ? 'schedule-share-pop' : ''}`}
              aria-label="Compartir horario"
              aria-expanded={shareOpen}
              title="Compartir horario"
            >
              <Share2
                className="h-[18px] w-[18px] transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-110"
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      {isSheet ? (
        <BottomSheet
          open={open}
          onClose={close}
          ariaLabel="Tus horarios"
          bare
          showHandle
          maxHeight="78dvh"
        >
          {panel}
        </BottomSheet>
      ) : (
        <AnimatedPopover
          open={open}
          anchorRef={chevronRef}
          popoverRef={popoverRef}
          align="right"
          offset={8}
          className="flex max-h-[min(26rem,68vh)] w-[min(18.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg"
        >
          {panel}
        </AnimatedPopover>
      )}

      {onShareSchedule && (
        <ShareSchedulePopover
          open={shareOpen}
          anchorRef={shareRef}
          popoverRef={sharePopoverRef}
          url={shareUrl}
          loading={shareLoading}
          onClose={closeShare}
        />
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
          isSheet ? 'pb-2.5 pt-1' : 'py-2'
        }`}
      >
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
