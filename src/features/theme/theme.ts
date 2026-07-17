export const THEME_STORAGE_KEY = 'poliplan:theme'

export type ThemePreference = 'light' | 'dark' | 'system'

export function resolveEffectiveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return preference
}

function runThemeUpdate(update: () => void) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }

  if (!prefersReducedMotion && typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(update)
    return
  }

  document.documentElement.classList.add('theme-transition')
  update()
  window.setTimeout(() => {
    document.documentElement.classList.remove('theme-transition')
  }, 340)
}

export function applyTheme(preference: ThemePreference) {
  runThemeUpdate(() => {
    const effective = resolveEffectiveTheme(preference)
    document.documentElement.classList.toggle('dark', effective === 'dark')
    document.documentElement.style.colorScheme = effective

    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference)
    } catch {
      // ignore quota / private mode
    }

    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', effective === 'dark' ? '#090c10' : '#0B3B8F')
  })
}

export function readStoredThemePreference(): ThemePreference | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    // ignore
  }
  return null
}
