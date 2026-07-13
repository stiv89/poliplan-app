import { useCallback, useEffect, useRef, useState } from 'react'
import { ScheduleOnboardingTour } from '@/components/onboarding/ScheduleOnboardingTour'
import { WelcomeFacultyModal } from '@/components/onboarding/WelcomeFacultyModal'
import { useSchedule } from '@/hooks/useSchedule'

export function AppOnboarding() {
  const { settings, startupMode, updateAppSettings } = useSchedule()
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const welcomeTriggeredRef = useRef(false)
  const tourTriggeredRef = useRef(false)

  useEffect(() => {
    if (startupMode !== 'ready' || !settings) return
    if (settings.appWelcomeCompletedAt) return
    if (settings.scheduleTourCompletedAt) {
      void updateAppSettings({ appWelcomeCompletedAt: settings.scheduleTourCompletedAt })
      return
    }
    if (welcomeTriggeredRef.current) return

    welcomeTriggeredRef.current = true
    setWelcomeOpen(true)
  }, [settings, startupMode, updateAppSettings])

  useEffect(() => {
    if (startupMode !== 'ready' || !settings) return
    if (!settings.appWelcomeCompletedAt) return
    if (settings.scheduleTourCompletedAt) return
    if (tourTriggeredRef.current) return

    tourTriggeredRef.current = true
    const timeout = window.setTimeout(() => setTourOpen(true), 500)
    return () => window.clearTimeout(timeout)
  }, [settings?.appWelcomeCompletedAt, settings?.scheduleTourCompletedAt, settings, startupMode])

  const completeWelcome = useCallback(() => {
    setWelcomeOpen(false)
    void updateAppSettings({ appWelcomeCompletedAt: new Date().toISOString() })
  }, [updateAppSettings])

  const finishTour = useCallback(() => {
    setTourOpen(false)
    void updateAppSettings({ scheduleTourCompletedAt: new Date().toISOString() })
  }, [updateAppSettings])

  return (
    <>
      <WelcomeFacultyModal open={welcomeOpen} onContinue={completeWelcome} />
      <ScheduleOnboardingTour open={tourOpen} onComplete={finishTour} onDismiss={finishTour} />
    </>
  )
}
