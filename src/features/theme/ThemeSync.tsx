import { useEffect } from 'react'
import { useSchedule } from '@/hooks/useSchedule'
import { applyTheme, type ThemePreference } from '@/features/theme/theme'

/** Applies saved theme preference to the document root. */
export function ThemeSync() {
  const { settings } = useSchedule()
  const preference: ThemePreference = settings?.theme ?? 'light'

  useEffect(() => {
    applyTheme(preference)
  }, [preference])

  useEffect(() => {
    if (preference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => applyTheme('system')
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [preference])

  return null
}
