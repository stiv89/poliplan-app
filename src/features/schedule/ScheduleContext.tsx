import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { db } from '@/db/database'
import { SYNC_INTERVAL_MS } from '@/config/constants'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { scheduleRepository } from '@/repositories/SupabaseScheduleRepository'
import { localScheduleRepository } from '@/repositories/LocalScheduleRepository'
import { scheduleSyncService } from '@/services/scheduleSyncService'
import { buildSharedScheduleUrl, publishSharedSchedule } from '@/services/sharedScheduleService'
import type {
  AcademicPeriod,
  Career,
  Course,
  CourseSection,
  ScheduleConflict,
  SyncStatus,
} from '@/types/academic'
import type { AppSettings, SavedScheduleRecord } from '@/types/schedule'
import type { SharedScheduleSnapshot } from '@/types/sharedSchedule'
import { detectScheduleConflicts } from '@/utils/conflicts'
import type { LocalSaveState } from '@/utils/scheduleSaveStatus'

export type StartupMode =
  | 'booting'
  | 'restoring'
  | 'downloading'
  | 'updating-data'
  | 'updating-app'
  | 'offline-no-cache'
  | 'ready'

export interface ScheduleContextValue {
  loading: boolean
  catalogLoading: boolean
  startupMode: StartupMode
  retryStartup: () => Promise<void>
  settings: AppSettings | null
  activePeriod: AcademicPeriod | null
  activeSchedule: SavedScheduleRecord | null
  savedSchedules: SavedScheduleRecord[]
  deletedSchedules: SavedScheduleRecord[]
  pendingDeletedSchedule: SavedScheduleRecord | null
  careers: Career[]
  courses: Course[]
  allSections: CourseSection[]
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  syncStatus: SyncStatus
  syncMessage?: string
  localSaveState: LocalSaveState
  lastUpdated: string | null
  isOnline: boolean
  wasOffline: boolean
  acknowledgeReconnected: () => void
  refreshAll: () => Promise<void>
  syncNow: (force?: boolean) => Promise<void>
  setSelectedCareer: (careerId: string | null) => Promise<void>
  setSelectedPeriod: (periodId: string | null) => Promise<void>
  updateAppSettings: (
    patch: Partial<
      Pick<
        AppSettings,
        | 'autoSyncEnabled'
        | 'syncOnOpen'
        | 'showChangeAlerts'
        | 'syncPromptDismissedAt'
        | 'notificationPromptDismissedAt'
        | 'scheduleTourCompletedAt'
        | 'lastUserScheduleSyncAt'
        | 'remoteScheduleByLocalId'
      >
    >,
  ) => Promise<void>
  resetPreferences: () => Promise<void>
  toggleSection: (section: CourseSection) => Promise<void>
  clearSchedule: () => Promise<void>
  switchSchedule: (scheduleId: string) => Promise<void>
  createSchedule: (name: string, copyFromScheduleId?: string | null) => Promise<void>
  shareSchedule: (scheduleId: string) => Promise<string>
  importSharedSchedule: (snapshot: SharedScheduleSnapshot) => Promise<void>
  renameSchedule: (scheduleId: string, name: string) => Promise<void>
  deleteSchedule: (scheduleId: string) => Promise<void>
  restoreSchedule: (scheduleId: string) => Promise<void>
  permanentlyDeleteSchedule: (scheduleId: string) => Promise<void>
  dismissPendingDelete: () => void
  undoPendingDelete: () => Promise<void>
  isSectionSelected: (sectionId: string) => boolean
  getCourseById: (courseId: string) => Course | undefined
  coursesById: Map<string, Course>
}

export const ScheduleContext = createContext<ScheduleContextValue | null>(null)

interface ScheduleProviderProps {
  children: ReactNode
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const { isOnline, wasOffline, acknowledgeReconnected } = useOnlineStatus()
  const [loading, setLoading] = useState(true)
  const [startupMode, setStartupMode] = useState<StartupMode>('booting')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [activePeriod, setActivePeriod] = useState<AcademicPeriod | null>(null)
  const [activeSchedule, setActiveSchedule] = useState<SavedScheduleRecord | null>(null)
  const [savedSchedules, setSavedSchedules] = useState<SavedScheduleRecord[]>([])
  const [deletedSchedules, setDeletedSchedules] = useState<SavedScheduleRecord[]>([])
  const [pendingDeletedSchedule, setPendingDeletedSchedule] =
    useState<SavedScheduleRecord | null>(null)
  const [careers, setCareers] = useState<Career[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesById, setCoursesById] = useState<Map<string, Course>>(new Map())
  const [allSections, setAllSections] = useState<CourseSection[]>([])
  const [selectedSections, setSelectedSections] = useState<CourseSection[]>([])
  const [loadedCatalogFor, setLoadedCatalogFor] = useState<{
    periodId: string
    careerId: string
  } | null>(null)
  const [catalogRefreshing, setCatalogRefreshing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncMessage, setSyncMessage] = useState<string | undefined>()
  const [localSaveState, setLocalSaveState] = useState<LocalSaveState>('idle')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const bootstrapCompleteRef = useRef(false)
  const hasLocalSnapshotRef = useRef(false)
  const initialSyncDoneRef = useRef(false)
  const pendingDeleteTimerRef = useRef<number | null>(null)
  const localSaveTimerRef = useRef<number | null>(null)

  const markScheduleSaving = useCallback(() => {
    setLocalSaveState('saving')
    if (localSaveTimerRef.current != null) {
      window.clearTimeout(localSaveTimerRef.current)
    }
  }, [])

  const markScheduleSaved = useCallback(() => {
    setLocalSaveState('saved')
    if (localSaveTimerRef.current != null) {
      window.clearTimeout(localSaveTimerRef.current)
    }
    localSaveTimerRef.current = window.setTimeout(() => {
      setLocalSaveState('idle')
      localSaveTimerRef.current = null
    }, 2500)
  }, [])

  const conflicts = useMemo(
    () => detectScheduleConflicts(selectedSections),
    [selectedSections],
  )

  const catalogLoading = useMemo(() => {
    const periodId = settings?.selectedAcademicPeriodId ?? activePeriod?.id ?? null
    const careerId =
      settings?.selectedCareerId ?? activeSchedule?.selectedCareerId ?? null
    if (!careerId || !periodId) return false
    if (catalogRefreshing) return true
    if (!loadedCatalogFor) return loading
    return (
      loadedCatalogFor.careerId !== careerId || loadedCatalogFor.periodId !== periodId
    )
  }, [
    settings,
    activePeriod,
    activeSchedule,
    loadedCatalogFor,
    loading,
    catalogRefreshing,
  ])

  const clearCatalogSnapshot = useCallback(() => {
    setAllSections([])
    setCourses([])
    setCatalogRefreshing(true)
  }, [])

  const loadData = useCallback(async (bootstrap = false) => {
    const isBootstrap = bootstrap || !bootstrapCompleteRef.current

    if (isBootstrap) {
      const hasLocalSnapshot = (await db.cachedAcademicPeriods.count()) > 0
      hasLocalSnapshotRef.current = hasLocalSnapshot
      const updateHint = window.sessionStorage.getItem('poliplan:startup-mode')
      if (updateHint === 'updating-app') {
        window.sessionStorage.removeItem('poliplan:startup-mode')
        setStartupMode('updating-app')
      } else if (!isOnline && !hasLocalSnapshot) {
        setStartupMode('offline-no-cache')
      } else {
        setStartupMode(hasLocalSnapshot ? 'restoring' : 'downloading')
      }
    }

    setLoading(true)
    try {
      const currentSettings = await localScheduleRepository.getSettings()
      setSettings(currentSettings)

      const allPeriods = await scheduleRepository.getAcademicPeriods()

      let period: AcademicPeriod | null | undefined
      let schedule: SavedScheduleRecord | null = null

      if (currentSettings.activeScheduleId) {
        const preferred = await localScheduleRepository.getSavedScheduleById(
          currentSettings.activeScheduleId,
        )
        if (preferred && preferred.deletedAt == null) {
          period = allPeriods.find((item) => item.id === preferred.academicPeriodId)
          if (period) {
            schedule = preferred
          }
        }
      }

      if (!period) {
        period =
          (currentSettings.selectedAcademicPeriodId
            ? allPeriods.find((item) => item.id === currentSettings.selectedAcademicPeriodId)
            : null) ?? allPeriods.find((item) => item.isActive) ?? null
      }

      setActivePeriod(period ?? null)

      if (!period) {
        setCareers([])
        setCourses([])
        setAllSections([])
        setSelectedSections([])
        setActiveSchedule(null)
        setSavedSchedules([])
        setDeletedSchedules([])
        setLoadedCatalogFor(null)
        return
      }

      if (!schedule) {
        schedule = await localScheduleRepository.resolveActiveSchedule(
          period.id,
          currentSettings.activeScheduleId,
          currentSettings.selectedCareerId,
        )
      }

      const careerId = schedule.selectedCareerId ?? currentSettings.selectedCareerId ?? undefined
      const settingsPatch: Partial<AppSettings> = {}
      if (currentSettings.activeScheduleId !== schedule.id) {
        settingsPatch.activeScheduleId = schedule.id
      }
      if (currentSettings.selectedAcademicPeriodId !== period.id) {
        settingsPatch.selectedAcademicPeriodId = period.id
      }
      if (careerId && currentSettings.selectedCareerId !== careerId) {
        settingsPatch.selectedCareerId = careerId
      }
      const nextSettings =
        Object.keys(settingsPatch).length > 0
          ? await localScheduleRepository.updateSettings(settingsPatch)
          : currentSettings
      setSettings(nextSettings)

      const [nextCareers, nextSections, selectedEntities, version, periodCourses, activeSchedules, trashedSchedules] =
        await Promise.all([
          scheduleRepository.getCareers(period.id),
          careerId
            ? scheduleRepository.getAllSections(period.id, careerId)
            : Promise.resolve([]),
          localScheduleRepository.getSelectedSectionEntities(schedule.id),
          scheduleRepository.getActiveScheduleVersion(period.id),
          scheduleRepository.getCoursesForPeriod(period.id),
          localScheduleRepository.getSavedSchedules(),
          localScheduleRepository
            .getSavedSchedules({ includeDeleted: true })
            .then((items) => items.filter((item) => item.deletedAt != null)),
        ])

      setActiveSchedule(schedule)
      setSavedSchedules(activeSchedules)
      setDeletedSchedules(trashedSchedules)

      setCareers(nextCareers)
      setAllSections(nextSections)
      setSelectedSections(selectedEntities)
      setLastUpdated(version?.importedAt ?? null)
      setCoursesById(new Map(periodCourses.map((course) => [course.id, course])))

      if (careerId) {
        setLoadedCatalogFor({ periodId: period.id, careerId })
      } else {
        setLoadedCatalogFor(null)
      }

      if (currentSettings.selectedCareerId) {
        const nextCourses = await scheduleRepository.getCourses(
          period.id,
          careerId ?? currentSettings.selectedCareerId,
        )
        setCourses(nextCourses)
      } else {
        setCourses([])
      }

      if (isBootstrap && period) {
        bootstrapCompleteRef.current = true
        setStartupMode('ready')
      }
    } catch (error) {
      if (isBootstrap && !isOnline) {
        setStartupMode('offline-no-cache')
      }
      throw error
    } finally {
      setCatalogRefreshing(false)
      setLoading(false)
    }
  }, [isOnline])

  useEffect(() => {
    void loadData(true).catch(() => undefined)
  }, [loadData])

  useEffect(() => {
    const unsubscribe = scheduleSyncService.subscribe((status, message) => {
      setSyncStatus(status)
      setSyncMessage(message)
      if (status === 'updated') {
        void loadData(!bootstrapCompleteRef.current).catch(() => undefined)
      }

      if (!bootstrapCompleteRef.current && status === 'downloading') {
        setStartupMode(hasLocalSnapshotRef.current ? 'updating-data' : 'downloading')
      }

      if (!bootstrapCompleteRef.current && status === 'error') {
        setStartupMode('offline-no-cache')
      }
    })

    return () => {
      unsubscribe()
      scheduleSyncService.stopAutoSync()
    }
  }, [loadData])

  useEffect(() => {
    if (!settings) return

    if (settings.autoSyncEnabled) {
      scheduleSyncService.startAutoSync(SYNC_INTERVAL_MS)
    } else {
      scheduleSyncService.stopAutoSync()
    }

    return () => scheduleSyncService.stopAutoSync()
  }, [settings?.autoSyncEnabled, settings])

  useEffect(() => {
    if (!settings || initialSyncDoneRef.current) return
    initialSyncDoneRef.current = true
    if (settings.syncOnOpen) {
      void scheduleSyncService.syncPeriod(settings.selectedAcademicPeriodId)
    }
  }, [settings])

  useEffect(() => {
    if (isOnline && wasOffline) {
      void scheduleSyncService.syncPeriod(settings?.selectedAcademicPeriodId ?? null, true)
    }
  }, [isOnline, wasOffline, settings?.selectedAcademicPeriodId])

  const setSelectedCareer = async (careerId: string | null) => {
    if (careerId !== settings?.selectedCareerId) {
      clearCatalogSnapshot()
    }
    const next = await localScheduleRepository.updateSettings({ selectedCareerId: careerId })
    setSettings(next)
    if (activeSchedule) {
      await localScheduleRepository.setSavedScheduleCareer(activeSchedule.id, careerId)
    }
    await loadData().catch(() => undefined)
  }

  const setSelectedPeriod = async (periodId: string | null) => {
    if (!periodId) return

    if (activeSchedule?.academicPeriodId === periodId) {
      if (settings?.selectedAcademicPeriodId !== periodId) {
        const next = await localScheduleRepository.updateSettings({
          selectedAcademicPeriodId: periodId,
        })
        setSettings(next)
      }
      return
    }

    clearCatalogSnapshot()

    const careerId =
      activeSchedule?.selectedCareerId ?? settings?.selectedCareerId ?? null
    const schedule = await localScheduleRepository.resolveActiveSchedule(
      periodId,
      null,
      careerId,
    )

    const next = await localScheduleRepository.updateSettings({
      activeScheduleId: schedule.id,
      selectedAcademicPeriodId: periodId,
      selectedCareerId: schedule.selectedCareerId ?? careerId,
    })
    setSettings(next)

    void scheduleSyncService.syncPeriod(periodId, false)
    await loadData().catch(() => undefined)
  }

  const updateAppSettings = async (
    patch: Partial<
      Pick<
        AppSettings,
        | 'autoSyncEnabled'
        | 'syncOnOpen'
        | 'showChangeAlerts'
        | 'syncPromptDismissedAt'
        | 'notificationPromptDismissedAt'
        | 'scheduleTourCompletedAt'
        | 'lastUserScheduleSyncAt'
        | 'remoteScheduleByLocalId'
      >
    >,
  ) => {
    const next = await localScheduleRepository.updateSettings(patch)
    setSettings(next)
  }

  const resetPreferences = async () => {
    const next = await localScheduleRepository.updateSettings({
      selectedCareerId: null,
      selectedAcademicPeriodId: null,
      activeScheduleId: null,
      autoSyncEnabled: true,
      syncOnOpen: true,
      showChangeAlerts: true,
    })
    setSettings(next)
    await loadData().catch(() => undefined)
  }

  const switchSchedule = async (scheduleId: string) => {
    const schedule = await localScheduleRepository.getSavedScheduleById(scheduleId)
    if (!schedule || schedule.deletedAt) return

    if (
      schedule.selectedCareerId !== settings?.selectedCareerId ||
      schedule.academicPeriodId !== settings?.selectedAcademicPeriodId
    ) {
      clearCatalogSnapshot()
    }

    const next = await localScheduleRepository.updateSettings({
      activeScheduleId: schedule.id,
      selectedCareerId: schedule.selectedCareerId,
      selectedAcademicPeriodId: schedule.academicPeriodId,
    })
    setSettings(next)
    await loadData().catch(() => undefined)
  }

  const createSchedule = async (name: string, copyFromScheduleId?: string | null) => {
    if (!activePeriod) return

    const schedule = await localScheduleRepository.createSavedSchedule({
      name,
      academicPeriodId: activePeriod.id,
      selectedCareerId: activeSchedule?.selectedCareerId ?? settings?.selectedCareerId ?? null,
      copyFromScheduleId,
    })

    const next = await localScheduleRepository.updateSettings({
      activeScheduleId: schedule.id,
      selectedCareerId: schedule.selectedCareerId,
      selectedAcademicPeriodId: schedule.academicPeriodId,
    })
    setSettings(next)
    await loadData().catch(() => undefined)
  }

  const shareSchedule = async (scheduleId: string) => {
    const schedule = await localScheduleRepository.getSavedScheduleById(scheduleId)
    if (!schedule || schedule.deletedAt) {
      throw new Error('not-found')
    }

    const sections = await localScheduleRepository.getSelectedSectionEntities(scheduleId)
    if (sections.length === 0) {
      throw new Error('empty')
    }

    const ref = await publishSharedSchedule({
      name: schedule.name,
      academicPeriodId: schedule.academicPeriodId,
      selectedCareerId: schedule.selectedCareerId,
      sectionIds: sections.map((section) => section.id),
    })

    return buildSharedScheduleUrl(ref)
  }

  const importSharedSchedule = async (snapshot: SharedScheduleSnapshot) => {
    const resolvedSections = (
      await Promise.all(snapshot.sectionIds.map((id) => scheduleRepository.getSectionById(id)))
    ).filter(
      (section): section is CourseSection =>
        section != null && section.academicPeriodId === snapshot.academicPeriodId,
    )

    if (resolvedSections.length === 0) {
      throw new Error('missing-sections')
    }

    const schedule = await localScheduleRepository.createSavedScheduleFromSections({
      name: `${snapshot.name} (copia)`,
      academicPeriodId: snapshot.academicPeriodId,
      selectedCareerId: snapshot.selectedCareerId,
      sections: resolvedSections.map((section) => ({
        sectionId: section.id,
        courseId: section.courseId,
        academicPeriodId: section.academicPeriodId,
      })),
    })

    if (
      snapshot.selectedCareerId !== settings?.selectedCareerId ||
      snapshot.academicPeriodId !== settings?.selectedAcademicPeriodId
    ) {
      clearCatalogSnapshot()
    }

    const next = await localScheduleRepository.updateSettings({
      activeScheduleId: schedule.id,
      selectedCareerId: schedule.selectedCareerId,
      selectedAcademicPeriodId: schedule.academicPeriodId,
    })
    setSettings(next)

    if (snapshot.academicPeriodId !== activePeriod?.id) {
      void scheduleSyncService.syncPeriod(snapshot.academicPeriodId, false)
    }

    await loadData().catch(() => undefined)
  }

  const renameSchedule = async (scheduleId: string, name: string) => {
    await localScheduleRepository.renameSavedSchedule(scheduleId, name)
    await loadData().catch(() => undefined)
  }

  const clearPendingDeleteTimer = () => {
    if (pendingDeleteTimerRef.current != null) {
      window.clearTimeout(pendingDeleteTimerRef.current)
      pendingDeleteTimerRef.current = null
    }
  }

  const dismissPendingDelete = () => {
    clearPendingDeleteTimer()
    setPendingDeletedSchedule(null)
  }

  const deleteSchedule = async (scheduleId: string) => {
    const schedule = await localScheduleRepository.getSavedScheduleById(scheduleId)
    if (!schedule || schedule.deletedAt) return

    await localScheduleRepository.softDeleteSavedSchedule(scheduleId)
    setPendingDeletedSchedule(schedule)
    clearPendingDeleteTimer()
    pendingDeleteTimerRef.current = window.setTimeout(() => {
      setPendingDeletedSchedule(null)
      pendingDeleteTimerRef.current = null
    }, 8000)

    if (activeSchedule?.id === scheduleId) {
      const remaining = await localScheduleRepository.getSavedSchedules({
        academicPeriodId: schedule.academicPeriodId,
      })
      const nextActive = remaining[0]
      if (nextActive) {
        await localScheduleRepository.updateSettings({ activeScheduleId: nextActive.id })
      } else {
        const created = await localScheduleRepository.ensureDefaultSchedule(
          schedule.academicPeriodId,
          schedule.selectedCareerId,
        )
        await localScheduleRepository.updateSettings({ activeScheduleId: created.id })
      }
    }

    await loadData().catch(() => undefined)
  }

  const restoreSchedule = async (scheduleId: string) => {
    await localScheduleRepository.restoreSavedSchedule(scheduleId)
    if (pendingDeletedSchedule?.id === scheduleId) {
      dismissPendingDelete()
    }
    await loadData().catch(() => undefined)
  }

  const permanentlyDeleteSchedule = async (scheduleId: string) => {
    await localScheduleRepository.permanentlyDeleteSavedSchedule(scheduleId)
    if (pendingDeletedSchedule?.id === scheduleId) {
      dismissPendingDelete()
    }
    await loadData().catch(() => undefined)
  }

  const undoPendingDelete = async () => {
    if (!pendingDeletedSchedule) return
    await restoreSchedule(pendingDeletedSchedule.id)
  }

  const toggleSection = async (section: CourseSection) => {
    if (!activePeriod || !activeSchedule) {
      return
    }

    markScheduleSaving()
    const isSelected = selectedSections.some((item) => item.id === section.id)
    try {
      if (isSelected) {
        await localScheduleRepository.removeSelectedSection(section.id, activeSchedule.id)
      } else {
        await localScheduleRepository.addSelectedSection({
          scheduleId: activeSchedule.id,
          sectionId: section.id,
          courseId: section.courseId,
          academicPeriodId: activePeriod.id,
        })
      }

      const nextSelected = await localScheduleRepository.getSelectedSectionEntities(
        activeSchedule.id,
      )
      setSelectedSections(nextSelected)
      markScheduleSaved()
    } catch (error) {
      setLocalSaveState('idle')
      throw error
    }
  }

  const isSectionSelected = (sectionId: string) =>
    selectedSections.some((section) => section.id === sectionId)

  const clearSchedule = async () => {
    if (!activeSchedule) return
    markScheduleSaving()
    try {
      await localScheduleRepository.clearSelectedSections(activeSchedule.id)
      setSelectedSections([])
      markScheduleSaved()
    } catch (error) {
      setLocalSaveState('idle')
      throw error
    }
  }

  const getCourseById = (courseId: string) => coursesById.get(courseId) ?? courses.find((course) => course.id === courseId)

  const value: ScheduleContextValue = {
    loading,
    catalogLoading,
    startupMode,
    retryStartup: () => loadData(true).catch(() => undefined),
    settings,
    activePeriod,
    activeSchedule,
    savedSchedules,
    deletedSchedules,
    pendingDeletedSchedule,
    careers,
    courses,
    allSections,
    selectedSections,
    conflicts,
    syncStatus,
    syncMessage,
    localSaveState,
    lastUpdated,
    isOnline,
    wasOffline,
    acknowledgeReconnected,
    refreshAll: loadData,
    syncNow: (force = true) =>
      scheduleSyncService.syncPeriod(
        activePeriod?.id ?? settings?.selectedAcademicPeriodId ?? null,
        force,
      ),
    setSelectedCareer,
    setSelectedPeriod,
    updateAppSettings,
    resetPreferences,
    toggleSection,
    clearSchedule,
    switchSchedule,
    createSchedule,
    shareSchedule,
    importSharedSchedule,
    renameSchedule,
    deleteSchedule,
    restoreSchedule,
    permanentlyDeleteSchedule,
    dismissPendingDelete,
    undoPendingDelete,
    isSectionSelected,
    getCourseById,
    coursesById,
  }

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}
