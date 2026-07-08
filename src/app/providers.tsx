import { useEffect, useState, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { ScheduleProvider } from '@/features/schedule/ScheduleContext'

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
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-lg rounded-2xl border border-primary/20 bg-surface p-4 shadow-lg md:bottom-6 md:left-auto md:right-6"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-text">Hay una nueva versión de PoliPlan disponible.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          onClick={() => void updateServiceWorker(true)}
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

function OnlineBanner({ children }: { children: ReactNode }) {
  return <>{children}</>
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
    <ScheduleProvider>
      <OnlineBanner>{children}</OnlineBanner>
      <PwaUpdatePrompt />
    </ScheduleProvider>
  )
}
