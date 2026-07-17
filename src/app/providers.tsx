import { useEffect, useRef, useState, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/Button'
import { AppOnboarding } from '@/components/onboarding/AppOnboarding'
import { ScheduleProvider } from '@/features/schedule/ScheduleContext'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeSync } from '@/features/theme/ThemeSync'
import { useSchedule } from '@/hooks/useSchedule'
import type { StartupMode } from '@/features/schedule/ScheduleContext'
import loaderGif from '../../logos/loader.gif'

const BLOCKING_STARTUP_MODES = new Set<StartupMode>(['offline-no-cache', 'updating-app'])

/** Applies a waiting PWA update automatically (no manual click). */
function PwaAutoUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const triggeredRef = useRef(false)

  useEffect(() => {
    if (!needRefresh || triggeredRef.current) return
    triggeredRef.current = true
    window.sessionStorage.setItem('poliplan:startup-mode', 'updating-app')
    void updateServiceWorker(true)
  }, [needRefresh, updateServiceWorker])

  return null
}

function StartupOverlay() {
  const { startupMode, retryStartup } = useSchedule()

  if (startupMode === 'ready' || !BLOCKING_STARTUP_MODES.has(startupMode)) {
    return null
  }

  const message =
    startupMode === 'offline-no-cache'
      ? 'Conectate a internet para descargar los horarios.'
      : 'Actualizando PoliPlan…'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 px-4 backdrop-blur-[5px]"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-xs flex-col items-center text-center">
        <img
          src={loaderGif}
          alt=""
          className="h-28 w-28 select-none object-contain"
          aria-hidden="true"
          draggable="false"
        />
        <p className="mt-5 text-sm font-medium text-slate-600">{message}</p>
        {startupMode === 'offline-no-cache' && (
          <Button
            variant="secondary"
            className="mt-5 w-full justify-center border-slate-200/80 bg-white/70 text-slate-700 hover:bg-white/90"
            onClick={() => void retryStartup()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        )}
      </div>
    </div>
  )
}

export function ScheduleAppShell() {
  return (
    <ScheduleProvider>
      <ThemeSync />
      <StartupOverlay />
      <AppOnboarding />
      <AppShell />
    </ScheduleProvider>
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <AuthProvider>
      {children}
      <PwaAutoUpdate />
    </AuthProvider>
  )
}
