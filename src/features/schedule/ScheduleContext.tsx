import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { SYNC_INTERVAL_MS } from '@/config/constants'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { scheduleRepository } from '@/repositories/SupabaseScheduleRepository'
import { localScheduleRepository } from '@/repositories/LocalScheduleRepository'
import { scheduleSyncService } from '@/services/scheduleSyncService'
import type {
  AcademicPeriod,
  Career,
  Course,
  CourseSection,
  ScheduleConflict,
  SyncStatus,
} from '@/types/academic'
import type { AppSettings } from '@/types/schedule'
import { detectScheduleConflicts } from '@/utils/conflicts'

export interface ScheduleContextValue {
  loading: boolean
  settings: AppSettings | null
  activePeriod: AcademicPeriod | null
  careers: Career[]
  courses: Course[]
  allSections: CourseSection[]
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  syncStatus: SyncStatus
  syncMessage?: string
  lastUpdated: string | null
  isOnline: boolean
  wasOffline: boolean
  acknowledgeReconnected: () => void
  refreshAll: () => Promise<void>
  syncNow: (force?: boolean) => Promise<void>
  setSelectedCareer: (careerId: string | null) => Promise<void>
  setSelectedPeriod: (periodId: string | null) => Promise<void>
  toggleSection: (section: CourseSection) => Promise<void>
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
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [activePeriod, setActivePeriod] = useState<AcademicPeriod | null>(null)
  const [careers, setCareers] = useState<Career[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesById, setCoursesById] = useState<Map<string, Course>>(new Map())
  const [allSections, setAllSections] = useState<CourseSection[]>([])
  const [selectedSections, setSelectedSections] = useState<CourseSection[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncMessage, setSyncMessage] = useState<string | undefined>()
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const conflicts = useMemo(
    () => detectScheduleConflicts(selectedSections),
    [selectedSections],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const currentSettings = await localScheduleRepository.getSettings()
      setSettings(currentSettings)

      const period =
        (currentSettings.selectedAcademicPeriodId
          ? await scheduleRepository
              .getAcademicPeriods()
              .then((periods) =>
                periods.find((item) => item.id === currentSettings.selectedAcademicPeriodId),
              )
          : null) ?? (await scheduleRepository.getActiveAcademicPeriod())

      setActivePeriod(period ?? null)

      if (!period) {
        setCareers([])
        setCourses([])
        setAllSections([])
        setSelectedSections([])
        return
      }

      const careerId = currentSettings.selectedCareerId ?? undefined
      const [nextCareers, nextSections, selectedEntities, version, periodCourses] =
        await Promise.all([
          scheduleRepository.getCareers(period.id),
          scheduleRepository.getAllSections(period.id, careerId),
          localScheduleRepository.getSelectedSectionEntities(period.id),
          scheduleRepository.getActiveScheduleVersion(period.id),
          scheduleRepository.getCoursesForPeriod(period.id),
        ])

      setCareers(nextCareers)
      setAllSections(nextSections)
      setSelectedSections(selectedEntities)
      setLastUpdated(version?.importedAt ?? null)
      setCoursesById(new Map(periodCourses.map((course) => [course.id, course])))

      if (currentSettings.selectedCareerId) {
        const nextCourses = await scheduleRepository.getCourses(
          period.id,
          currentSettings.selectedCareerId,
        )
        setCourses(nextCourses)
      } else {
        setCourses([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    const unsubscribe = scheduleSyncService.subscribe((status, message) => {
      setSyncStatus(status)
      setSyncMessage(message)
      if (status === 'updated') {
        void loadData()
      }
    })

    scheduleSyncService.startAutoSync(SYNC_INTERVAL_MS)
    void scheduleSyncService.syncActivePeriod()

    return () => {
      unsubscribe()
      scheduleSyncService.stopAutoSync()
    }
  }, [loadData])

  useEffect(() => {
    if (isOnline && wasOffline) {
      void scheduleSyncService.syncActivePeriod(true)
    }
  }, [isOnline, wasOffline])

  const setSelectedCareer = async (careerId: string | null) => {
    const next = await localScheduleRepository.updateSettings({ selectedCareerId: careerId })
    setSettings(next)
    await loadData()
  }

  const setSelectedPeriod = async (periodId: string | null) => {
    const next = await localScheduleRepository.updateSettings({
      selectedAcademicPeriodId: periodId,
    })
    setSettings(next)
    await loadData()
  }

  const toggleSection = async (section: CourseSection) => {
    if (!activePeriod) {
      return
    }

    const isSelected = selectedSections.some((item) => item.id === section.id)
    if (isSelected) {
      await localScheduleRepository.removeSelectedSection(section.id, activePeriod.id)
    } else {
      await localScheduleRepository.addSelectedSection({
        sectionId: section.id,
        courseId: section.courseId,
        academicPeriodId: activePeriod.id,
      })
    }

    const nextSelected = await localScheduleRepository.getSelectedSectionEntities(
      activePeriod.id,
    )
    setSelectedSections(nextSelected)
  }

  const isSectionSelected = (sectionId: string) =>
    selectedSections.some((section) => section.id === sectionId)

  const getCourseById = (courseId: string) => coursesById.get(courseId) ?? courses.find((course) => course.id === courseId)

  const value: ScheduleContextValue = {
    loading,
    settings,
    activePeriod,
    careers,
    courses,
    allSections,
    selectedSections,
    conflicts,
    syncStatus,
    syncMessage,
    lastUpdated,
    isOnline,
    wasOffline,
    acknowledgeReconnected,
    refreshAll: loadData,
    syncNow: (force = true) => scheduleSyncService.syncActivePeriod(force),
    setSelectedCareer,
    setSelectedPeriod,
    toggleSection,
    isSectionSelected,
    getCourseById,
    coursesById,
  }

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}
