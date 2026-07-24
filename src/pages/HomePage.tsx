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
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Bell,
  Cloud,
  CircleHelp,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import scheduleEmptyIllustration from '../../logos/schedule-empty-illustration.webp'
import { DAYS_OF_WEEK, ROUTES } from '@/config/constants'
import { ScheduleSaveStatus } from '@/components/guest/ScheduleSaveStatus'
import { useAuth } from '@/features/auth/AuthContext'
import { useGuestExperience } from '@/features/guest/GuestExperienceContext'
import { useChanges } from '@/hooks/useChanges'
import { useSchedule } from '@/hooks/useSchedule'
import { SectionSearchPanel } from '@/components/schedule/SectionSearchPanel'
import { ScheduleContextBar } from '@/components/schedule/ScheduleContextBar'
import { ScheduleContextSelector } from '@/components/schedule/ScheduleContextSelector'
import type { ScheduleShareData } from '@/components/schedule/ShareSchedulePopover'
import { formatCareerCompactLabel } from '@/utils/scheduleHeader'
import {
  ScheduleUndoToast,
  type SchedulePickerPanelProps,
} from '@/components/schedule/SchedulePickerSheet'
import { WeeklyScheduleGrid } from '@/components/schedule/WeeklyScheduleGrid'
import { DayScheduleView } from '@/components/schedule/DayScheduleView'
import { MobileDaySelector } from '@/components/schedule/MobileDaySelector'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useHorizontalDaySwipe } from '@/hooks/useHorizontalDaySwipe'
import { scheduleRepository } from '@/repositories/SupabaseScheduleRepository'
import { DEFAULT_SCHEDULE_VIEW_FILTERS } from '@/types/scheduleFilters'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import type { AcademicPeriod, CourseSection, Career } from '@/types/academic'

// ── Componente principal ──────────────────────────────────────────────────────

export function HomePage() {
  const {
    loading,
    startupMode,
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
  } = useSchedule()

  const { user } = useAuth()
  const { requestScheduleSync } = useGuestExperience()
  const { unseenCount } = useChanges()

  // Drawer state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchPrefill, setSearchPrefill] = useState('')
  const [shareError, setShareError] = useState<string | null>(null)

  // Mobile state
  const [mobileDay, setMobileDay] = useState<number>(new Date().getDay() || 1)

  // Action loading
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [previewSection, setPreviewSection] = useState<CourseSection | null>(null)
  const [viewFilters] = useState<ScheduleViewFilters>(
    DEFAULT_SCHEDULE_VIEW_FILTERS,
  )
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([])

  useEffect(() => {
    void scheduleRepository.getAcademicPeriods().then(setAcademicPeriods)
  }, [activePeriod?.id])

  const openSearch = useCallback((prefill = '') => {
    setSearchPrefill(prefill)
    setSearchOpen(true)
  }, [])

  const handleShareSchedule = useCallback(
    async (scheduleId: string): Promise<string> => {
      setShareError(null)
      try {
        return await shareSchedule(scheduleId)
      } catch (error) {
        const code = error instanceof Error ? error.message : 'unknown'
        if (code === 'empty') {
          setShareError('Agregá al menos una materia antes de compartir este horario.')
        } else if (code === 'too-large') {
          setShareError('Este horario es muy grande para compartir sin conexión. Probá con Supabase activo.')
        } else {
          setShareError('No pudimos generar el link. Intentá de nuevo.')
        }
        throw error
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
      // Si se agrega/quita la sección del preview, no tiene sentido seguir mostrando solape.
      setPreviewSection((current) => (current?.id === section.id ? null : current))
      setToggleLoading(true)
      try {
        await toggleSection(section)
      } finally {
        setToggleLoading(false)
      }
    },
    [toggleSection],
  )

  // Nunca previsualizar una sección que ya está en el horario (evita “conflicto” consigo misma).
  const activePreviewSection = useMemo(() => {
    if (!previewSection) return null
    if (selectedSections.some((section) => section.id === previewSection.id)) return null
    return previewSection
  }, [previewSection, selectedSections])

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

  const shareData = useMemo<ScheduleShareData>(() => {
    const career = careers.find((item) => item.id === settings?.selectedCareerId)
    const careerLabel = career ? formatCareerCompactLabel(career) : null
    const subtitle = [careerLabel, activePeriod?.name].filter(Boolean).join(' · ') || null

    return {
      scheduleName: activeSchedule?.name ?? 'Mi horario',
      subtitle,
      selectedSections,
      coursesById: new Map(
        [...coursesById.entries()].map(([id, course]) => [
          id,
          { name: course.name, code: course.code ?? null },
        ]),
      ),
    }
  }, [
    activePeriod?.name,
    activeSchedule?.name,
    careers,
    coursesById,
    selectedSections,
    settings?.selectedCareerId,
  ])

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
    previewSectionId: activePreviewSection?.id ?? null,
    viewFilters,
    catalogLoading,
    onCareerChange: (careerId: string | null) => void setSelectedCareer(careerId),
  }

  const hasScheduleSections = selectedSections.length > 0
  // Avoid flashing empty onboarding while Dexie restore / bootstrap is still running.
  const showEmptySchedule =
    !hasScheduleSections && !loading && startupMode === 'ready' && !activePreviewSection

  const mobileDayValues = useMemo(() => DAYS_OF_WEEK.map((day) => day.value), [])

  const goToPreviousMobileDay = useCallback(() => {
    setMobileDay((current) => {
      const index = mobileDayValues.indexOf(current as (typeof mobileDayValues)[number])
      if (index <= 0) return current
      return mobileDayValues[index - 1]!
    })
  }, [mobileDayValues])

  const goToNextMobileDay = useCallback(() => {
    setMobileDay((current) => {
      const index = mobileDayValues.indexOf(current as (typeof mobileDayValues)[number])
      if (index < 0 || index >= mobileDayValues.length - 1) return current
      return mobileDayValues[index + 1]!
    })
  }, [mobileDayValues])

  const {
    ref: daySwipeRef,
    offsetX: daySwipeOffsetX,
    isAnimating: daySwipeAnimating,
  } = useHorizontalDaySwipe({
    onPrevious: goToPreviousMobileDay,
    onNext: goToNextMobileDay,
    enabled: hasScheduleSections,
  })

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
          className="course-panel-surface flex h-full min-h-0 w-[min(400px,32vw)] max-w-[420px] shrink-0 flex-col overflow-hidden border-r border-slate-200/60 bg-surface"
          data-tour="course-panel"
        >
          <SectionSearchPanel key={searchPrefill} {...searchPanelProps} />
        </aside>

        {/* Horario — área principal */}
        <div className="schedule-main-surface relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50/45">
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
                ? () => handleShareSchedule(activeSchedule.id)
                : undefined
            }
            shareData={shareData}
          />

          <div className="relative min-h-0 flex-1 overflow-hidden" data-tour="schedule-grid">
            <WeeklyScheduleGrid
              selectedSections={selectedSections}
              conflicts={conflicts}
              coursesById={coursesMeta}
              onRemoveSection={(id) => void handleRemove(id)}
              onViewAlternatives={handleViewAlternatives}
              removingId={removingId}
              previewSection={activePreviewSection}
              viewFilters={viewFilters}
            />
            {showEmptySchedule && (
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
            {!hasScheduleSections && activePreviewSection && (
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
            activeSchedule?.id ? () => handleShareSchedule(activeSchedule.id) : undefined
          }
          shareData={shareData}
          isEmpty={showEmptySchedule}
        />

        {hasScheduleSections ? (
          <div className="mobile-day-panel flex min-h-0 flex-1 flex-col overflow-hidden">
            <MobileDaySelector
              days={DAYS_OF_WEEK}
              activeDay={mobileDay}
              onDayChange={setMobileDay}
            />

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="day-content relative">
                <div
                  ref={daySwipeRef}
                  className="day-content-swipe"
                  style={{
                    transform: daySwipeOffsetX
                      ? `translateX(${daySwipeOffsetX}px)`
                      : undefined,
                    transition: daySwipeAnimating
                      ? 'transform 220ms cubic-bezier(0.32, 0.72, 0, 1)'
                      : 'none',
                  }}
                >
                  <DayScheduleView
                    key={mobileDay}
                    day={mobileDay}
                    selectedSections={selectedSections}
                    conflicts={conflicts}
                    coursesById={coursesMeta}
                    onRemoveSection={(id) => void handleRemove(id)}
                    onViewAlternatives={handleViewAlternatives}
                    removingId={removingId}
                  />
                </div>

                <button
                  onClick={() => openSearch()}
                  data-tour="add-course-fab"
                  className="bottom-above-dock fixed right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary/90 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label="Agregar materia"
                >
                  <Plus className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        ) : showEmptySchedule ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6">
            <EmptyScheduleMobileOnboarding
              hasCareer={Boolean(settings?.selectedCareerId)}
              onAddFirst={() => openSearch()}
              onSync={isOnline ? requestScheduleSync : undefined}
              onShowTour={() => window.dispatchEvent(new Event('poliplan:show-schedule-tour'))}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center" aria-busy="true">
            <span className="sr-only">Cargando tu horario…</span>
          </div>
        )}

        {/* Bottom sheet: Búsqueda */}
        <BottomSheet
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          ariaLabel="Agregar materia"
          title="Agregar materia"
          tall
          className="overflow-hidden"
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
  shareData,
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
  onShareSchedule?: () => Promise<string>
  shareData?: ScheduleShareData
}) {
  return (
    <header className="shrink-0 px-6 py-3">
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
        shareData={shareData}
      />
      <div className="mt-2">
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
  shareData,
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
  onShareSchedule?: () => Promise<string>
  shareData?: ScheduleShareData
  isEmpty?: boolean
}) {
  return (
    <header className={`schedule-mobile-header shrink-0 ${isEmpty ? 'schedule-mobile-header--empty' : ''}`}>
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
        shareData={shareData}
        syncStatus={{
          isOnline,
          isAuthenticated,
          localSaveState,
          userSyncAt,
          officialDataSyncing,
          onSync,
        }}
      />
    </header>
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
  return (
    <div className="flex w-full max-w-[20rem] flex-col items-center text-center">
      <img
        src={scheduleEmptyIllustration}
        alt="Ilustración de un horario académico"
        width={520}
        height={520}
        className="mb-6 h-auto max-h-[210px] w-[min(58vw,210px)] object-contain opacity-90"
        draggable={false}
      />
      <h2 className="text-lg font-semibold tracking-tight text-text">
        {hasCareer ? 'Agregá tu primera materia' : 'Armá tu horario'}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {hasCareer
          ? 'Elegí una materia y sección para empezar.'
          : 'Primero elegí tu carrera y después agregá las materias.'}
      </p>
      <button
        type="button"
        onClick={onAddFirst}
        data-tour={hasCareer ? 'add-first-course' : 'choose-career'}
        className="mt-6 flex h-[62px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white shadow-[0_6px_18px_rgba(11,59,143,0.18)] hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {hasCareer ? 'Agregar mi primera materia' : 'Elegir carrera'}
      </button>
      <div className="mt-5 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2">
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
