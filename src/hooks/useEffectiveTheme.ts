import { useSchedule } from '@/hooks/useSchedule'
import { resolveEffectiveTheme } from '@/features/theme/theme'

/** Resolved light/dark theme from saved preference (incl. system). */
export function useEffectiveTheme(): 'light' | 'dark' {
  const { settings } = useSchedule()
  return resolveEffectiveTheme(settings?.theme ?? 'light')
}
