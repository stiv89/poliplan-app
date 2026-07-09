import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationPromptSheet } from '@/components/guest/NotificationPromptSheet'
import { ScheduleConflictSheet } from '@/components/guest/ScheduleConflictSheet'
import { SyncScheduleSheet } from '@/components/guest/SyncScheduleSheet'
import { ROUTES } from '@/config/constants'
import { useAuth } from '@/features/auth/AuthContext'
import { useSchedule } from '@/hooks/useSchedule'
import { localScheduleRepository } from '@/repositories/LocalScheduleRepository'
import {
  syncUserScheduleAfterLogin,
  syncUserScheduleForAuthenticatedUser,
  type ScheduleConflictResolution,
  type UserScheduleSyncResult,
} from '@/services/userScheduleSyncService'
import {
  browserNotificationsPending,
  shouldShowNotificationPrompt,
  shouldShowSyncPrompt,
} from '@/utils/guestPrompts'

interface GuestExperienceContextValue {
  requestScheduleSync: () => void
  syncToast: string | null
  dismissSyncToast: () => void
}

const GuestExperienceContext = createContext<GuestExperienceContextValue | null>(null)

export function GuestExperienceProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { selectedSections, settings, refreshAll } = useSchedule()

  const [syncSheetOpen, setSyncSheetOpen] = useState(false)
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false)
  const [conflict, setConflict] = useState<Extract<UserScheduleSyncResult, { type: 'conflict' }> | null>(
    null,
  )
  const [syncToast, setSyncToast] = useState<string | null>(null)
  const syncPromptShownRef = useRef(false)
  const notificationPromptShownRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  const dismissSyncPrompt = useCallback(async () => {
    await localScheduleRepository.updateSettings({
      syncPromptDismissedAt: new Date().toISOString(),
    })
    setSyncSheetOpen(false)
  }, [])

  const dismissNotificationPrompt = useCallback(async () => {
    await localScheduleRepository.updateSettings({
      notificationPromptDismissedAt: new Date().toISOString(),
    })
    setNotificationSheetOpen(false)
  }, [])

  const finishSync = useCallback(
    async (message?: string) => {
      if (message) setSyncToast(message)
      await refreshAll()
      window.dispatchEvent(new CustomEvent('poliplan:changes-updated'))
    },
    [refreshAll],
  )

  const handlePostLogin = useCallback(
    async (userId: string, resolution?: ScheduleConflictResolution) => {
      const result = await syncUserScheduleAfterLogin(userId, resolution)

      if (result.type === 'conflict') {
        setConflict(result)
        return
      }

      if (
        result.type === 'uploaded' ||
        result.type === 'downloaded' ||
        result.type === 'merged'
      ) {
        await finishSync('Tu horario se sincronizó correctamente.')
      }
    },
    [finishSync],
  )

  const requestScheduleSync = useCallback(() => {
    if (user) {
      void syncUserScheduleForAuthenticatedUser(user.id)
        .then(() => finishSync('Tu horario se sincronizó correctamente.'))
        .catch(async () => {
          const evaluation = await syncUserScheduleAfterLogin(user.id)
          if (evaluation.type === 'conflict') {
            setConflict(evaluation)
          }
        })
      return
    }

    setSyncSheetOpen(true)
  }, [user, finishSync])

  useEffect(() => {
    if (user || syncPromptShownRef.current) return
    if (selectedSections.length < 2) return
    if (!shouldShowSyncPrompt(settings?.syncPromptDismissedAt ?? null)) return

    syncPromptShownRef.current = true
    const timeout = window.setTimeout(() => setSyncSheetOpen(true), 800)
    return () => window.clearTimeout(timeout)
  }, [selectedSections.length, settings?.syncPromptDismissedAt, user])

  useEffect(() => {
    if (notificationPromptShownRef.current || syncSheetOpen) return
    if (selectedSections.length < 1) return
    if (!browserNotificationsPending()) return
    if (!shouldShowNotificationPrompt(settings?.notificationPromptDismissedAt ?? null)) return

    notificationPromptShownRef.current = true
    const timeout = window.setTimeout(() => setNotificationSheetOpen(true), 2000)
    return () => window.clearTimeout(timeout)
  }, [
    selectedSections.length,
    settings?.notificationPromptDismissedAt,
    syncSheetOpen,
  ])

  useEffect(() => {
    if (!user?.id || user.id === lastUserIdRef.current) return
    lastUserIdRef.current = user.id
    void handlePostLogin(user.id)
  }, [user?.id, handlePostLogin])

  const handleEnableNotifications = useCallback(async () => {
    if (browserNotificationsPending()) {
      await Notification.requestPermission()
    }
    await localScheduleRepository.updateSettings({
      showChangeAlerts: true,
      notificationPromptDismissedAt: new Date().toISOString(),
    })
    setNotificationSheetOpen(false)
  }, [])

  const handleResolveConflict = useCallback(
    async (resolution: ScheduleConflictResolution) => {
      if (!user || !conflict) return
      setConflict(null)
      await handlePostLogin(user.id, resolution)
    },
    [conflict, handlePostLogin, user],
  )

  const value = useMemo(
    () => ({
      requestScheduleSync,
      syncToast,
      dismissSyncToast: () => setSyncToast(null),
    }),
    [requestScheduleSync, syncToast],
  )

  return (
    <GuestExperienceContext.Provider value={value}>
      {children}

      <SyncScheduleSheet
        open={syncSheetOpen}
        onClose={() => setSyncSheetOpen(false)}
        onCreateAccount={() => {
          setSyncSheetOpen(false)
          navigate(ROUTES.settings)
        }}
        onDismiss={() => void dismissSyncPrompt()}
      />

      <NotificationPromptSheet
        open={notificationSheetOpen}
        onClose={() => setNotificationSheetOpen(false)}
        onEnable={() => void handleEnableNotifications()}
        onDismiss={() => void dismissNotificationPrompt()}
      />

      {conflict && (
        <ScheduleConflictSheet
          open
          localCount={conflict.localSectionIds.length}
          remote={conflict.remote}
          onResolve={(resolution) => void handleResolveConflict(resolution)}
          onClose={() => setConflict(null)}
        />
      )}

      {syncToast && (
        <div
          className="bottom-above-dock fixed left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-lg md:bottom-6"
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{syncToast}</p>
            <button
              type="button"
              className="shrink-0 text-emerald-700 hover:underline"
              onClick={() => setSyncToast(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </GuestExperienceContext.Provider>
  )
}

export function useGuestExperience(): GuestExperienceContextValue {
  const context = useContext(GuestExperienceContext)
  if (!context) {
    throw new Error('useGuestExperience debe usarse dentro de GuestExperienceProvider')
  }
  return context
}
