/**
 * HomePage — Organizador principal de PoliPlan (UX simplificado)
 *
 * Desktop: navegación lateral compacta + área principal del horario
 * Mobile:  header compacto + selector de días + vista diaria + FAB + bottom sheets
 *
 * Progressive disclosure:
 *   - Solo el calendario es permanente.
 *   - Agregar materia → drawer izquierdo.
 *   - Resumen/Exámenes/Cambios → drawer derecho.
 *   - Detalle de clase → popover inline.
 *   - Conflictos → etiqueta + intervalo exacto.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Bell,
  X,
  Info,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DAYS_OF_WEEK, ROUTES } from '@/config/constants'
import { ScheduleSaveStatus } from '@/components/guest/ScheduleSaveStatus'
import { useAuth } from '@/features/auth/AuthContext'
import { useGuestExperience } from '@/features/guest/GuestExperienceContext'
import { useChanges } from '@/hooks/useChanges'
import { useSchedule } from '@/hooks/useSchedule'
import { SectionSearchPanel } from '@/components/schedule/SectionSearchPanel'
import { ScheduleContextBar } from '@/components/schedule/ScheduleContextBar'
import {
  ScheduleUndoToast,
  type SchedulePickerPanelProps,
} from '@/components/schedule/SchedulePickerSheet'
import { WeeklyScheduleGrid } from '@/components/schedule/WeeklyScheduleGrid'
import { DayScheduleView } from '@/components/schedule/DayScheduleView'
import { ContextPanel } from '@/components/schedule/ContextPanel'
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
    lastUpdated,
    switchSchedule,
    createSchedule,
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
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [searchPrefill, setSearchPrefill] = useState('')

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

  useEffect(() => {
    void scheduleRepository.getAcademicPeriods().then(setAcademicPeriods)
  }, [activePeriod?.id])

  const selectedCareer = careers.find((c) => c.id === settings?.selectedCareerId)

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
        setSummaryOpen(false)
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

  const openSearch = useCallback((prefill = '') => {
    setSummaryOpen(false)
    setSearchPrefill(prefill)
    setSearchOpen(true)
  }, [])

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

  const schedulePickerProps = {
    activeSchedule,
    schedules: savedSchedules,
    deletedSchedules,
    periodName: activePeriod?.name ?? null,
    onSelect: (scheduleId: string) => void switchSchedule(scheduleId),
    onCreate: (name: string, copyFromScheduleId?: string | null) =>
      void createSchedule(name, copyFromScheduleId),
    onRename: (scheduleId: string, name: string) => void renameSchedule(scheduleId, name),
    onDelete: (scheduleId: string) => void deleteSchedule(scheduleId),
    onRestore: (scheduleId: string) => void restoreSchedule(scheduleId),
    onPermanentDelete: (scheduleId: string) => void permanentlyDeleteSchedule(scheduleId),
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
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
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
      <div className="hidden flex-1 overflow-hidden md:flex">
        {/* Panel de materias — permanente, al lado del sidebar */}
        <aside className="flex h-full min-h-0 w-[min(360px,30vw)] max-w-[400px] shrink-0 flex-col overflow-hidden border-r border-slate-100/80 bg-surface">
          <SectionSearchPanel key={searchPrefill} {...searchPanelProps} />
        </aside>

        {/* Horario */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <ScheduleHeader
            scheduleName={activeSchedule?.name ?? 'Mi horario'}
            periodName={activePeriod?.name ?? null}
            academicPeriods={academicPeriods}
            selectedPeriodId={activePeriod?.id ?? settings?.selectedAcademicPeriodId ?? null}
            onPeriodChange={(periodId) => void setSelectedPeriod(periodId)}
            conflictCount={conflicts.length}
            careers={careers}
            selectedCareerId={settings?.selectedCareerId ?? null}
            onCareerChange={(careerId) => void setSelectedCareer(careerId)}
            scheduleCareers={scheduleCareers}
            onSummary={() => setSummaryOpen((v) => !v)}
            schedulePicker={schedulePickerProps}
            isOnline={isOnline}
            isAuthenticated={!!user}
            localSaveState={localSaveState}
            userSyncAt={settings?.lastUserScheduleSyncAt ?? null}
            officialDataSyncing={syncStatus === 'downloading' || syncStatus === 'checking'}
            onSync={requestScheduleSync}
          />

          <div className="relative min-h-0 flex-1 overflow-hidden">
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
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 px-6">
                <EmptySchedule periodName={activePeriod?.name ?? null} compact />
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

          {summaryOpen && (
            <div
              className="absolute inset-0 z-20 bg-black/10"
              onClick={() => setSummaryOpen(false)}
              aria-hidden="true"
            />
          )}

          <SummaryDrawer
            open={summaryOpen}
            onClose={() => setSummaryOpen(false)}
            activePeriod={activePeriod}
            selectedCareer={selectedCareer}
            selectedSections={selectedSections}
            conflicts={conflicts}
            coursesById={coursesMeta}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

      {/* ── MÓVIL ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        {/* Header móvil compacto */}
        <MobileHeader
          scheduleName={activeSchedule?.name ?? 'Mi horario'}
          periodName={activePeriod?.name ?? null}
          academicPeriods={academicPeriods}
          selectedPeriodId={activePeriod?.id ?? settings?.selectedAcademicPeriodId ?? null}
          onPeriodChange={(periodId) => void setSelectedPeriod(periodId)}
          conflictCount={conflicts.length}
          careers={careers}
          selectedCareerId={settings?.selectedCareerId ?? null}
          onCareerChange={(careerId) => void setSelectedCareer(careerId)}
          scheduleCareers={scheduleCareers}
          onSummary={() => {
            setSearchOpen(false)
            setSummaryOpen((v) => !v)
          }}
          schedulePicker={schedulePickerProps}
          isOnline={isOnline}
          isAuthenticated={!!user}
          localSaveState={localSaveState}
          userSyncAt={settings?.lastUserScheduleSyncAt ?? null}
          officialDataSyncing={syncStatus === 'downloading' || syncStatus === 'checking'}
          onSync={requestScheduleSync}
        />

        {/* Selector de días */}
        <div className="shrink-0 border-b border-slate-100 bg-surface">
          <div className="flex gap-1 overflow-x-auto px-3 py-2">
            {DAYS_OF_WEEK.map((day) => {
              const hasMeetings = selectedSections.some((s) =>
                s.meetings.some((m) => m.dayOfWeek === day.value),
              )
              const isActive = mobileDay === day.value
              return (
                <button
                  key={day.value}
                  onClick={() => setMobileDay(day.value)}
                  className={`flex min-h-11 min-w-[52px] shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-xs font-medium transition ${
                    isActive ? 'bg-primary text-white' : 'text-muted hover:bg-slate-100'
                  }`}
                  aria-pressed={isActive}
                >
                  <span>{day.label.slice(0, 3)}</span>
                  {hasMeetings && (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white/80' : 'bg-primary'}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Vista del día */}
        <div className="relative flex-1 overflow-y-auto">
          {selectedSections.length === 0 ? (
            <EmptyScheduleMobile periodName={activePeriod?.name ?? null} />
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

          {/* FAB: Agregar materia */}
          <button
            onClick={() => openSearch()}
            className="fixed bottom-20 right-4 z-30 flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Agregar materia"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            <span>Agregar materia</span>
          </button>
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

        {/* Bottom sheet: Resumen */}
        <BottomSheet
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          minimal
        >
          <ContextPanel
            activePeriod={activePeriod}
            selectedCareer={selectedCareer}
            selectedSections={selectedSections}
            conflicts={conflicts}
            coursesById={coursesMeta}
            lastUpdated={lastUpdated}
            onClose={() => setSummaryOpen(false)}
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
    </div>
  )
}

// ── Header compartido ─────────────────────────────────────────────────────────

function SummaryInfoButton({
  onClick,
  hasConflict,
}: {
  onClick: () => void
  hasConflict: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted/60 transition hover:bg-slate-100 hover:text-muted"
      aria-label="Ver resumen del horario"
    >
      <Info className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
      {hasConflict && (
        <span
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-surface"
          aria-hidden="true"
        />
      )}
    </button>
  )
}

function ScheduleHeader({
  scheduleName,
  periodName,
  academicPeriods,
  selectedPeriodId,
  onPeriodChange,
  conflictCount,
  careers,
  selectedCareerId,
  onCareerChange,
  scheduleCareers,
  onSummary,
  schedulePicker,
  isOnline,
  isAuthenticated,
  localSaveState,
  userSyncAt,
  officialDataSyncing,
  onSync,
}: {
  scheduleName: string
  periodName: string | null
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  conflictCount: number
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  scheduleCareers: Career[]
  onSummary: () => void
  schedulePicker: Omit<SchedulePickerPanelProps, 'open' | 'onClose' | 'periodName'>
  isOnline: boolean
  isAuthenticated: boolean
  localSaveState: import('@/utils/scheduleSaveStatus').LocalSaveState
  userSyncAt: string | null
  officialDataSyncing: boolean
  onSync: () => void
}) {
  return (
    <header className="shrink-0 border-b border-slate-100/70 px-6 py-2.5">
      <div className="flex items-start justify-between gap-4">
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
        />
        <SummaryInfoButton onClick={onSummary} hasConflict={conflictCount > 0} />
      </div>
      <div className="mt-1.5">
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
  conflictCount,
  careers,
  selectedCareerId,
  onCareerChange,
  scheduleCareers,
  onSummary,
  schedulePicker,
  isOnline,
  isAuthenticated,
  localSaveState,
  userSyncAt,
  officialDataSyncing,
  onSync,
}: {
  scheduleName: string
  periodName: string | null
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  conflictCount: number
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  scheduleCareers: Career[]
  onSummary: () => void
  schedulePicker: Omit<SchedulePickerPanelProps, 'open' | 'onClose' | 'periodName'>
  isOnline: boolean
  isAuthenticated: boolean
  localSaveState: import('@/utils/scheduleSaveStatus').LocalSaveState
  userSyncAt: string | null
  officialDataSyncing: boolean
  onSync: () => void
}) {
  return (
    <header className="shrink-0 border-b border-slate-100/70 px-4 py-2">
      <div className="flex items-start justify-between gap-3">
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
        />
        <SummaryInfoButton onClick={onSummary} hasConflict={conflictCount > 0} />
      </div>
      <div className="mt-1.5">
        <ScheduleSaveStatus
          isOnline={isOnline}
          isAuthenticated={isAuthenticated}
          localSaveState={localSaveState}
          userSyncAt={userSyncAt}
          officialDataSyncing={officialDataSyncing}
          onSync={onSync}
          compact
        />
      </div>
    </header>
  )
}

// ── Drawer resumen (desktop) ──────────────────────────────────────────────────

function SummaryDrawer({
  open,
  onClose,
  ...panelProps
}: {
  open: boolean
  onClose: () => void
  activePeriod: import('@/types/academic').AcademicPeriod | null
  selectedCareer: import('@/types/academic').Career | undefined
  selectedSections: CourseSection[]
  conflicts: import('@/types/academic').ScheduleConflict[]
  coursesById: Map<string, { name: string; code: string | null }>
  lastUpdated: string | null
}) {
  return (
    <div
      className={`absolute right-0 top-0 z-30 flex h-full flex-col border-l border-slate-200/80 bg-surface shadow-xl transition-all duration-200 ${
        open ? 'w-[320px]' : 'w-0 overflow-hidden'
      }`}
      aria-hidden={!open}
    >
      {open && (
        <ContextPanel {...panelProps} onClose={onClose} />
      )}
    </div>
  )
}

// ── Bottom sheet (móvil) ──────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  title,
  minimal = false,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  minimal?: boolean
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
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl"
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
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  )
}

// ── Estado vacío desktop ──────────────────────────────────────────────────────

function EmptySchedule({
  periodName,
  compact = false,
}: {
  periodName: string | null
  compact?: boolean
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="rounded-full bg-primary/8 p-6">
        <svg
          className="h-12 w-12 text-primary/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.25}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div>
        <p className="text-xl font-bold text-text">Empezá a armar tu horario</p>
        <p className="mt-1.5 text-sm text-muted">
          {compact
            ? 'Elegí tu carrera y agregá materias desde el panel de la izquierda.'
            : 'Buscá una materia y elegí la sección que mejor te convenga.'}
        </p>
      </div>
      {periodName && (
        <div className="mt-2 text-xs text-muted/70">
          <p>{periodName}</p>
          <p>Datos oficiales verificados</p>
        </div>
      )}
    </div>
  )
}

// ── Estado vacío móvil ────────────────────────────────────────────────────────

function EmptyScheduleMobile({ periodName }: { periodName: string | null }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 pb-24 text-center">
      <div className="rounded-full bg-primary/8 p-5">
        <svg
          className="h-10 w-10 text-primary/60"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.25}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <div>
        <p className="font-bold text-text">Empezá a armar tu horario</p>
        <p className="mt-1 text-sm text-muted">Tocá el botón + para agregar materias.</p>
      </div>
      {periodName && (
        <div className="mt-2 text-xs text-muted/70">
          <p>{periodName}</p>
          <p>Datos oficiales verificados</p>
        </div>
      )}
    </div>
  )
}
