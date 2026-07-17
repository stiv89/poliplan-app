import { useEffect, useState, type ReactNode } from 'react'
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

function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) {
    return null
  }

  return (
    <div
      className="bottom-above-dock fixed left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-primary/20 bg-surface p-4 shadow-lg md:bottom-6 md:left-auto md:right-6"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-text">Hay una nueva versión de PoliPlan disponible.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            window.sessionStorage.setItem('poliplan:startup-mode', 'updating-app')
            void updateServiceWorker(true)
          }}
        >
          Actualizar
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-muted"
          onClick={() => setNeedRefresh(false)}
        >
          Más tarde
        </button>
      </div>
    </div>
  )
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
      <PwaUpdatePrompt />
    </AuthProvider>
  )
}
