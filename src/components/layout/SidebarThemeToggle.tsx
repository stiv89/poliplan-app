import { Moon, Sun } from 'lucide-react'
import { useSchedule } from '@/hooks/useSchedule'
import { resolveEffectiveTheme } from '@/features/theme/theme'

export function SidebarThemeToggle() {
  const { settings, updateAppSettings } = useSchedule()
  const preference = settings?.theme ?? 'light'
  const isDark = resolveEffectiveTheme(preference) === 'dark'

  return (
    <button
      type="button"
      onClick={() => void updateAppSettings({ theme: isDark ? 'light' : 'dark' })}
      className="group relative z-10 flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-slate-500/90 transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-slate-600 active:scale-[0.96] dark:text-slate-400 dark:hover:text-slate-200"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo nocturno'}
      title={isDark ? 'Modo claro' : 'Modo nocturno'}
    >
      {isDark ? (
        <Sun className="h-[21px] w-[21px] stroke-[1.5] transition-transform duration-300 group-hover:rotate-12" />
      ) : (
        <Moon className="h-[21px] w-[21px] stroke-[1.5] transition-transform duration-300 group-hover:-rotate-12" />
      )}
      <span className="max-w-full truncate text-[10px] leading-none opacity-90">
        {isDark ? 'Claro' : 'Oscuro'}
      </span>
    </button>
  )
}
