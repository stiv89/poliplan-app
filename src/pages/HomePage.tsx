/**
 * HomePage — Organizador principal de PoliPlan (UX simplificado)
 *
 * Desktop: navegación lateral compacta + área principal del horario
 * Mobile:  header compacto + onboarding guiado sin materias;
 *          con materias → selector de días + vista diaria + FAB
 *
 * Progressive disclosure:
 *   - Solo el calendario es permanente.
 *   - Agregar materia → drawer izquierdo.
 *   - Detalle de clase → popover inline.
 *   - Conflictos → etiqueta + intervalo exacto.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Bell,
  X,
  Cloud,
  CircleHelp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import logoMark from '../../logos/logo-sidebar.png'
import scheduleEmptyIllustration from '../../logos/schedule-empty-illustration.webp'
import { DAYS_OF_WEEK, ROUTES } from '@/config/constants'
import { ScheduleSaveStatus } from '@/components/guest/ScheduleSaveStatus'
import { useAuth } from '@/features/auth/AuthContext'
import { useGuestExperience } from '@/features/guest/GuestExperienceContext'
import { useChanges } from '@/hooks/useChanges'
import { useSchedule } from '@/hooks/useSchedule'
import { SectionSearchPanel } from '@/components/schedule/SectionSearchPanel'
import { ShareScheduleDialog } from '@/components/schedule/ShareScheduleDialog'
import { ScheduleContextBar } from '@/components/schedule/ScheduleContextBar'
import { ScheduleContextSelector } from '@/components/schedule/ScheduleContextSelector'
import { ScheduleOnboardingTour } from '@/components/onboarding/ScheduleOnboardingTour'
import {
  ScheduleUndoToast,
  type SchedulePickerPanelProps,
} from '@/components/schedule/SchedulePickerSheet'
import { WeeklyScheduleGrid } from '@/components/schedule/WeeklyScheduleGrid'
import { DayScheduleView } from '@/components/schedule/DayScheduleView'
import { scheduleRepository } from '@/repositories/SupabaseScheduleRepository'
import { DEFAULT_SCHEDULE_VIEW_FILTERS } from '@/types/scheduleFilters'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import type { AcademicPeriod, CourseSection, Career } from '@/types/academic'

// ── Componente principal ──────────────────────────────────────────────────────

export function HomePage() {
  const {
    activePeriod,
    activeSchedule,
    savedSchedules,
    deletedSchedules,
    pendingDeletedSchedule,
    careers,
    settings,
    allSections,
    catalogLoading,
    selectedSections,
    conflicts,
    coursesById,
    isSectionSelected,
    toggleSection,
    setSelectedCareer,
    setSelectedPeriod,
    switchSchedule,
    createSchedule,
    shareSchedule,
    renameSchedule,
    deleteSchedule,
    restoreSchedule,
    permanentlyDeleteSchedule,
    undoPendingDelete,
    dismissPendingDelete,
    isOnline,
    syncStatus,
    localSaveState,
    startupMode,
    updateAppSettings,
  } = useSchedule()

  const { user } = useAuth()
  const { requestScheduleSync } = useGuestExperience()
  const { unseenCount } = useChanges()

  // Drawer state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchPrefill, setSearchPrefill] = useState('')
  const [shareDialogUrl, setShareDialogUrl] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)

  // Mobile state
  const [mobileDay, setMobileDay] = useState<number>(new Date().getDay() || 1)

  // Action loading
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [previewSection, setPreviewSection] = useState<CourseSection | null>(null)
  const [viewFilters, setViewFilters] = useState<ScheduleViewFilters>(
    DEFAULT_SCHEDULE_VIEW_FILTERS,
  )
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([])
  const [tourOpen, setTourOpen] = useState(false)
  const tourTriggeredRef = useRef(false)

  useEffect(() => {
    if (
      tourTriggeredRef.current ||
      startupMode !== 'ready' ||
      !settings ||
      settings.scheduleTourCompletedAt ||
      selectedSections.length === 0
    ) {
      return
    }

    tourTriggeredRef.current = true
    const timeout = window.setTimeout(() => setTourOpen(true), 700)
    return () => window.clearTimeout(timeout)
  }, [settings, startupMode, selectedSections.length])

  const finishTour = useCallback(() => {
    setTourOpen(false)
    void updateAppSettings({ scheduleTourCompletedAt: new Date().toISOString() })
  }, [updateAppSettings])

  useEffect(() => {
    void scheduleRepository.getAcademicPeriods().then(setAcademicPeriods)
  }, [activePeriod?.id])

  const openSearch = useCallback((prefill = '') => {
    setSearchPrefill(prefill)
    setSearchOpen(true)
  }, [])

  const handleShareSchedule = useCallback(
    async (scheduleId: string) => {
      setShareError(null)
      try {
        const url = await shareSchedule(scheduleId)
        setShareDialogUrl(url)
      } catch (error) {
        const code = error instanceof Error ? error.message : 'unknown'
        if (code === 'empty') {
          setShareError('Agregá al menos una materia antes de compartir este horario.')
        } else if (code === 'too-large') {
          setShareError('Este horario es muy grande para compartir sin conexión. Probá con Supabase activo.')
        } else {
          setShareError('No pudimos generar el link. Intentá de nuevo.')
        }
      }
    },
    [shareSchedule],
  )

  const handleRemove = useCallback(
    async (sectionId: string) => {
      const section = selectedSections.find((s) => s.id === sectionId)
      if (!section) return
      setRemovingId(sectionId)
      try {
        await toggleSection(section)
      } finally {
        setRemovingId(null)
      }
    },
    [selectedSections, toggleSection],
  )

  const handleToggle = useCallback(
    async (section: CourseSection) => {
      setToggleLoading(true)
      try {
        await toggleSection(section)
      } finally {
        setToggleLoading(false)
      }
    },
    [toggleSection],
  )

  // Cerrar drawers con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const coursesMeta = new Map(
    [...coursesById.entries()].map(([id, course]) => [
      id,
      { name: course.name, code: course.code ?? null },
    ]),
  )

  const coursesWithLevel = useMemo(
    () =>
      new Map(
        [...coursesById.entries()].map(([id, course]) => [
          id,
          {
            name: course.name,
            code: course.code ?? null,
            level: course.level ?? null,
            semester: course.semester ?? null,
            careerId: course.careerId,
          },
        ]),
      ),
    [coursesById],
  )

  const scheduleCareers = useMemo(() => {
    const careerIds = new Set<string>()
    if (settings?.selectedCareerId) {
      careerIds.add(settings.selectedCareerId)
    }
    for (const section of selectedSections) {
      const careerId = coursesById.get(section.courseId)?.careerId
      if (careerId) careerIds.add(careerId)
    }
    return careers.filter((career) => careerIds.has(career.id))
  }, [careers, coursesById, selectedSections, settings?.selectedCareerId])

  const handleViewAlternatives = useCallback(
    (courseId: string) => {
      const course = coursesById.get(courseId)
      const prefill = course?.name ?? course?.code ?? ''
      setSearchPrefill(prefill)
      if (course?.careerId && course.careerId !== settings?.selectedCareerId) {
        void setSelectedCareer(course.careerId)
      }
      openSearch(prefill)
    },
    [coursesById, openSearch, settings?.selectedCareerId, setSelectedCareer],
  )

  const periodLabelsById = useMemo(
    () => Object.fromEntries(academicPeriods.map((period) => [period.id, period.name])),
    [academicPeriods],
  )

  const careerLabelsById = useMemo(
    () =>
      Object.fromEntries(
        careers.map((career) => [career.id, career.code ?? career.name]),
      ),
    [careers],
  )

  const schedulePickerProps = {
    activeSchedule,
    schedules: savedSchedules,
    deletedSchedules,
    periodName: activePeriod?.name ?? null,
    periodLabelsById,
    careerLabelsById,
    onSelect: (scheduleId: string) => void switchSchedule(scheduleId),
    onCreate: (name: string, copyFromScheduleId?: string | null) =>
      void createSchedule(name, copyFromScheduleId),
    onRename: (scheduleId: string, name: string) => void renameSchedule(scheduleId, name),
    onDelete: (scheduleId: string) => void deleteSchedule(scheduleId),
    onRestore: (scheduleId: string) => void restoreSchedule(scheduleId),
    onPermanentDelete: (scheduleId: string) => void permanentlyDeleteSchedule(scheduleId),
    onShare: (scheduleId: string) => void handleShareSchedule(scheduleId),
  }

  const searchPanelProps = {
    careers,
    selectedCareerId: settings?.selectedCareerId ?? null,
    allSections,
    coursesById: coursesWithLevel,
    conflicts,
    isSectionSelected,
    onToggle: (s: CourseSection) => void handleToggle(s),
    toggleLoading,
    initialSearch: searchPrefill,
    onPreviewSection: setPreviewSection,
    previewSectionId: previewSection?.id ?? null,
    viewFilters,
    onViewFiltersChange: setViewFilters,
    academicPeriods,
    selectedPeriodId: activePeriod?.id ?? settings?.selectedAcademicPeriodId ?? null,
    onPeriodChange: (periodId: string) => void setSelectedPeriod(periodId),
    catalogLoading,
    selectedSectionIds: selectedSections.map((section) => section.id),
    onCareerChange: (careerId: string | null) => void setSelectedCareer(careerId),
  }

  const hasScheduleSections = selectedSections.length > 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── BANNERS ─────────────────────────────────────────────────── */}
      {/* El banner de offline se muestra globalmente en OnlineStatusBanner (AppShell) */}
      {settings?.showChangeAlerts !== false && unseenCount > 0 && (
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-amber-700">
            <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {unseenCount} cambio{unseenCount !== 1 ? 's' : ''} sin revisar
          </div>
          <Link to={ROUTES.changes} className="shrink-0 font-medium text-amber-800 hover:underline">
            Revisar
          </Link>
        </div>
      )}

      {/* ── DESKTOP ─────────────────────────────────────────────────── */}
      <div className="hidden min-h-0 flex-1 overflow-hidden md:flex">
        {/* Explorador de materias — columna central del shell */}
        <aside
          className="flex h-full min-h-0 w-[min(400px,32vw)] max-w-[420px] shrink-0 flex-col overflow-hidden border-r border-slate-200/60 bg-white"
          data-tour="course-panel"
        >
          <SectionSearchPanel key={searchPrefill} {...searchPanelProps} />
        </aside>

        {/* Horario — área principal */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50/45">
          <ScheduleHeader
            scheduleName={activeSchedule?.name ?? 'Mi horario'}
            periodName={activePeriod?.name ?? null}
            academicPeriods={academicPeriods}
            selectedPeriodId={activePeriod?.id ?? settings?.selectedAcademicPeriodId ?? null}
            onPeriodChange={(periodId) => void setSelectedPeriod(periodId)}
            careers={careers}
            selectedCareerId={settings?.selectedCareerId ?? null}
            onCareerChange={(careerId) => void setSelectedCareer(careerId)}
            scheduleCareers={scheduleCareers}
            schedulePicker={schedulePickerProps}
            isOnline={isOnline}
            isAuthenticated={!!user}
            localSaveState={localSaveState}
            userSyncAt={settings?.lastUserScheduleSyncAt ?? null}
            officialDataSyncing={syncStatus === 'downloading' || syncStatus === 'checking'}
            onSync={requestScheduleSync}
            onShareSchedule={
              activeSchedule?.id
                ? () => void handleShareSchedule(activeSchedule.id)
                : undefined
            }
          />

          <div className="relative min-h-0 flex-1 overflow-hidden" data-tour="schedule-grid">
            <WeeklyScheduleGrid
              selectedSections={selectedSections}
              conflicts={conflicts}
              coursesById={coursesMeta}
              onRemoveSection={(id) => void handleRemove(id)}
              onViewAlternatives={handleViewAlternatives}
              removingId={removingId}
              previewSection={previewSection}
              viewFilters={viewFilters}
            />
            {selectedSections.length === 0 && !previewSection && (
              <div
                className={`pointer-events-none absolute inset-0 flex items-center justify-center px-6 ${
                  settings?.selectedCareerId ? 'bg-background/55' : 'bg-background/40'
                }`}
              >
                <EmptySchedule
                  compact
                  phase={settings?.selectedCareerId ? 'needs-section' : 'needs-career'}
                />
              </div>
            )}
            {selectedSections.length === 0 && previewSection && (
              <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
                <p className="rounded-full bg-white/90 px-3 py-1 text-xs text-muted shadow-sm">
                  Vista previa — agregá la materia para confirmar
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── MÓVIL ───────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/40 md:hidden">
        <MobileHeader
          scheduleName={activeSchedule?.name ?? 'Mi horario'}
          periodName={activePeriod?.name ?? null}
          academicPeriods={academicPeriods}
          selectedPeriodId={activePeriod?.id ?? settings?.selectedAcademicPeriodId ?? null}
          onPeriodChange={(periodId) => void setSelectedPeriod(periodId)}
          careers={careers}
          selectedCareerId={settings?.selectedCareerId ?? null}
          onCareerChange={(careerId) => void setSelectedCareer(careerId)}
          schedulePicker={schedulePickerProps}
          isOnline={isOnline}
          isAuthenticated={!!user}
          localSaveState={localSaveState}
          userSyncAt={settings?.lastUserScheduleSyncAt ?? null}
          officialDataSyncing={syncStatus === 'downloading' || syncStatus === 'checking'}
          onSync={requestScheduleSync}
          onShareSchedule={
            activeSchedule?.id ? () => void handleShareSchedule(activeSchedule.id) : undefined
          }
          isEmpty={!hasScheduleSections}
        />

        {hasScheduleSections && (
          <div className="shrink-0 px-2 py-2" data-tour="day-selector">
            <div className="grid grid-cols-6 gap-1">
              {DAYS_OF_WEEK.map((day) => {
                const hasMeetings = selectedSections.some((s) =>
                  s.meetings.some((m) => m.dayOfWeek === day.value),
                )
                const isActive = mobileDay === day.value
                return (
                  <button
                    key={day.value}
                    onClick={() => setMobileDay(day.value)}
                    className={`flex min-h-10 w-full flex-col items-center justify-center rounded-lg px-1 py-1.5 text-xs font-normal transition ${
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100/80'
                    }`}
                    aria-pressed={isActive}
                  >
                    <span>{day.label.slice(0, 3)}</span>
                    {hasMeetings && (
                      <span
                        className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white/70' : 'bg-slate-400/70'}`}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {!hasScheduleSections ? (
            <EmptyScheduleMobileOnboarding
              hasCareer={Boolean(settings?.selectedCareerId)}
              onAddFirst={() => openSearch()}
              onSync={isOnline ? requestScheduleSync : undefined}
              onShowTour={() => setTourOpen(true)}
            />
          ) : (
            <DayScheduleView
              day={mobileDay}
              selectedSections={selectedSections}
              conflicts={conflicts}
              coursesById={coursesMeta}
              onRemoveSection={(id) => void handleRemove(id)}
              onViewAlternatives={handleViewAlternatives}
              removingId={removingId}
            />
          )}

          {hasScheduleSections && (
            <button
              onClick={() => openSearch()}
              data-tour="add-course-fab"
              className="bottom-above-dock fixed right-4 z-30 flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Agregar materia"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span>Agregar materia</span>
            </button>
          )}
        </div>

        {/* Bottom sheet: Búsqueda */}
        <BottomSheet
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          title="Agregar materia"
        >
          <SectionSearchPanel
            key={searchPrefill}
            {...searchPanelProps}
            onClose={() => setSearchOpen(false)}
          />
        </BottomSheet>
      </div>

      {pendingDeletedSchedule && (
        <ScheduleUndoToast
          scheduleName={pendingDeletedSchedule.name}
          onUndo={() => void undoPendingDelete()}
          onDismiss={dismissPendingDelete}
        />
      )}

      <ScheduleOnboardingTour open={tourOpen} onComplete={finishTour} onDismiss={finishTour} />

      <ShareScheduleDialog
        open={Boolean(shareDialogUrl)}
        url={shareDialogUrl ?? ''}
        onClose={() => setShareDialogUrl(null)}
      />

      {shareError && (
        <div className="fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-lg">
          {shareError}
          <button
            type="button"
            className="ml-3 font-medium underline"
            onClick={() => setShareError(null)}
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}

// ── Header compartido ─────────────────────────────────────────────────────────

function ScheduleHeader({
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
  isOnline,
  isAuthenticated,
  localSaveState,
  userSyncAt,
  officialDataSyncing,
  onSync,
  onShareSchedule,
}: {
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
  isOnline: boolean
  isAuthenticated: boolean
  localSaveState: import('@/utils/scheduleSaveStatus').LocalSaveState
  userSyncAt: string | null
  officialDataSyncing: boolean
  onSync: () => void
  onShareSchedule?: () => void
}) {
  return (
    <header className="shrink-0 border-b border-slate-200/50 bg-slate-50/45 px-6 py-2">
      <ScheduleContextBar
        scheduleName={scheduleName}
        periodName={periodName}
        academicPeriods={academicPeriods}
        selectedPeriodId={selectedPeriodId}
        onPeriodChange={onPeriodChange}
        careers={careers}
        selectedCareerId={selectedCareerId}
        onCareerChange={onCareerChange}
        scheduleCareers={scheduleCareers}
        schedulePicker={schedulePicker}
        onShareSchedule={onShareSchedule}
      />
      <div className="mt-1">
        <ScheduleSaveStatus
          isOnline={isOnline}
          isAuthenticated={isAuthenticated}
          localSaveState={localSaveState}
          userSyncAt={userSyncAt}
          officialDataSyncing={officialDataSyncing}
          onSync={onSync}
        />
      </div>
    </header>
  )
}

function MobileHeader({
  scheduleName,
  periodName,
  academicPeriods,
  selectedPeriodId,
  onPeriodChange,
  careers,
  selectedCareerId,
  onCareerChange,
  schedulePicker,
  isOnline,
  isAuthenticated,
  localSaveState,
  userSyncAt,
  officialDataSyncing,
  onSync,
  onShareSchedule,
  isEmpty = false,
}: {
  scheduleName: string
  periodName: string | null
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  schedulePicker: Omit<SchedulePickerPanelProps, 'open' | 'onClose' | 'periodName'>
  isOnline: boolean
  isAuthenticated: boolean
  localSaveState: import('@/utils/scheduleSaveStatus').LocalSaveState
  userSyncAt: string | null
  officialDataSyncing: boolean
  onSync: () => void
  onShareSchedule?: () => void
  isEmpty?: boolean
}) {
  return (
    <header className={`shrink-0 px-4 ${isEmpty ? 'pt-2.5 pb-3' : 'py-2'}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <img
          src={logoMark}
          alt=""
          className={`shrink-0 select-none rounded-lg object-contain opacity-90 ${
            isEmpty ? 'h-7 w-7' : 'h-8 w-8'
          }`}
          draggable={false}
          aria-hidden="true"
        />
        <h1 className="text-lg font-bold tracking-tight text-text">PoliPlan</h1>
      </div>
      <ScheduleContextSelector
        presentation="sheet"
        scheduleName={scheduleName}
        periodName={periodName}
        academicPeriods={academicPeriods}
        selectedPeriodId={selectedPeriodId}
        onPeriodChange={onPeriodChange}
        careers={careers}
        selectedCareerId={selectedCareerId}
        onCareerChange={onCareerChange}
        schedulePicker={schedulePicker}
        onShareSchedule={onShareSchedule}
      />

      {!isEmpty && (
        <div className="mt-1.5">
          <ScheduleSaveStatus
            isOnline={isOnline}
            isAuthenticated={isAuthenticated}
            localSaveState={localSaveState}
            userSyncAt={userSyncAt}
            officialDataSyncing={officialDataSyncing}
            onSync={onSync}
            compact
            hiddenUnlessNotable
          />
        </div>
      )}
    </header>
  )
}

// ── Bottom sheet (móvil) ──────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  title,
  minimal = false,
  tall = false,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  minimal?: boolean
  tall?: boolean
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[24px] border-t border-slate-200 bg-surface shadow-2xl ${
          tall ? 'h-[90dvh] max-h-[90dvh]' : 'max-h-[85dvh]'
        }`}
        role="dialog"
        aria-label={title ?? 'Panel'}
      >
        {minimal ? (
          <div className="relative shrink-0 pt-2">
            <div
              className="mx-auto h-1 w-10 rounded-full bg-slate-200"
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="relative flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            <div
              className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-text">{title}</p>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 text-muted" />
            </button>
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </>
  )
}

// ── Estado vacío desktop ──────────────────────────────────────────────────────

type EmptySchedulePhase = 'needs-career' | 'needs-section'

function EmptySchedule({
  compact = false,
  phase = 'needs-career',
}: {
  compact?: boolean
  phase?: EmptySchedulePhase
}) {
  const isPassive = phase === 'needs-career'

  return (
    <div className="flex -translate-y-10 flex-col items-center justify-center px-6 text-center">
      <img
        src={scheduleEmptyIllustration}
        alt="Ilustración de un horario académico"
        width={520}
        height={520}
        className={`mb-8 h-auto max-h-[260px] w-[clamp(200px,22vw,260px)] object-contain ${
          isPassive ? 'opacity-[0.65]' : 'opacity-90'
        }`}
        draggable={false}
      />
      <h2
        className={`tracking-tight ${
          isPassive
            ? 'text-base font-semibold text-slate-500'
            : 'text-lg font-semibold text-slate-700'
        }`}
      >
        {isPassive ? 'Tu horario aparecerá acá' : 'Agregá tu primera materia'}
      </h2>
      <p
        className={`mt-2 max-w-sm leading-relaxed ${
          isPassive ? 'text-sm text-slate-400' : 'text-sm text-muted'
        }`}
      >
        {isPassive
          ? 'Cuando agregues una materia, vas a verla organizada por día.'
          : compact
            ? 'Elegí una sección desde el panel izquierdo para empezar.'
            : 'Elegí una sección para empezar a armar tu horario.'}
      </p>
    </div>
  )
}

// ── Estado vacío móvil (onboarding) ───────────────────────────────────────────

function EmptyScheduleMobileOnboarding({
  hasCareer,
  onAddFirst,
  onSync,
  onShowTour,
}: {
  hasCareer: boolean
  onAddFirst: () => void
  onSync?: () => void
  onShowTour: () => void
}) {
  const isPassive = !hasCareer

  return (
    <div className="flex min-h-full -translate-y-10 flex-col items-center justify-center px-6 pb-10 pt-6 text-center">
      <img
        src={scheduleEmptyIllustration}
        alt="Ilustración de un horario académico"
        width={520}
        height={520}
        className={`mb-8 h-auto max-h-[230px] w-[clamp(200px,58vw,230px)] object-contain ${
          isPassive ? 'opacity-[0.65]' : 'opacity-90'
        }`}
        draggable={false}
      />
      <h2
        className={`tracking-tight ${
          isPassive
            ? 'text-base font-semibold text-slate-500'
            : 'text-lg font-semibold text-text'
        }`}
      >
        {isPassive ? 'Tu horario aparecerá acá' : 'Agregá tu primera materia'}
      </h2>
      <p
        className={`mt-2 max-w-[18rem] leading-relaxed ${
          isPassive ? 'text-sm text-slate-400' : 'text-sm text-muted'
        }`}
      >
        {isPassive
          ? 'Cuando agregues una materia, vas a verla organizada por día.'
          : 'Elegí una materia y sección para empezar.'}
      </p>
      {!isPassive && (
        <button
          type="button"
          onClick={onAddFirst}
          className="mt-6 flex h-[62px] w-[84%] max-w-[18rem] items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-white shadow-[0_6px_18px_rgba(11,59,143,0.18)] hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Agregar mi primera materia
        </button>
      )}
      <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 ${isPassive ? 'mt-6' : 'mt-5'}`}>
        {onSync && (
          <button
            type="button"
            onClick={onSync}
            className="inline-flex items-center gap-1.5 text-xs text-muted/80 transition hover:text-primary"
          >
            <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
            Sincronizar
          </button>
        )}
        <button
          type="button"
          onClick={onShowTour}
          className="inline-flex items-center gap-1.5 text-xs text-muted/80 transition hover:text-primary"
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
          Ver cómo funciona
        </button>
      </div>
    </div>
  )
}
