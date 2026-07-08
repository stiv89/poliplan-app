import type { ReactNode } from 'react'
import { Children } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type SettingsCategoryId =
  | 'account'
  | 'academic'
  | 'notifications'
  | 'data'
  | 'app'
  | 'advanced'

export const SETTINGS_CATEGORIES: Array<{ id: SettingsCategoryId; label: string }> = [
  { id: 'account', label: 'Cuenta' },
  { id: 'academic', label: 'Académico' },
  { id: 'notifications', label: 'Notificaciones' },
  { id: 'data', label: 'Datos y conexión' },
  { id: 'app', label: 'Aplicación' },
  { id: 'advanced', label: 'Avanzado' },
]

export function SettingsPageShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain bg-background md:bg-transparent">
      <div className="mx-auto w-full max-w-[1080px] flex-1 px-4 py-5 pb-10 md:px-10 md:py-8 lg:px-12">
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        <div className="mt-5 md:mt-6">{children}</div>
      </div>
    </div>
  )
}

export function SettingsDesktopLayout({
  nav,
  panel,
}: {
  nav: ReactNode
  panel: ReactNode
}) {
  return (
    <div className="hidden gap-10 md:flex">
      <aside className="w-44 shrink-0">{nav}</aside>
      <div className="min-w-0 flex-1">{panel}</div>
    </div>
  )
}

export function SettingsCategoryNav({
  active,
  onSelect,
}: {
  active: SettingsCategoryId
  onSelect: (id: SettingsCategoryId) => void
}) {
  return (
    <nav className="space-y-0.5" aria-label="Categorías de ajustes">
      {SETTINGS_CATEGORIES.map((category) => {
        const isActive = category.id === active
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              isActive
                ? 'bg-slate-100 font-medium text-text'
                : 'text-muted hover:bg-slate-50 hover:text-text'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {category.label}
          </button>
        )
      })}
    </nav>
  )
}

export function SettingsMobileCategoryList({
  onSelect,
}: {
  onSelect: (id: SettingsCategoryId) => void
}) {
  return (
    <div className="md:hidden">
      <SettingsGroup>
        {SETTINGS_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50/80"
          >
            <span className="text-[15px] text-text">{category.label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted/40" aria-hidden="true" />
          </button>
        ))}
      </SettingsGroup>
    </div>
  )
}

export function SettingsMobilePanel({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: ReactNode
}) {
  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-primary transition hover:text-primary/80"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Ajustes
      </button>
      <h2 className="sr-only">{title}</h2>
      {children}
    </div>
  )
}

export function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        {description && (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{description}</p>
        )}
      </header>
      {children}
    </section>
  )
}

export function SettingsSection({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className={title ? 'mt-5 first:mt-0' : ''}>
      {title && (
        <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted/80">
          {title}
        </h3>
      )}
      <SettingsGroup>{children}</SettingsGroup>
    </section>
  )
}

export function SettingsGroup({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean)

  return (
    <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-slate-100/90">
      {items.map((child, index) => (
        <div key={index}>
          {index > 0 && <div className="ml-4 h-px bg-slate-100" aria-hidden="true" />}
          {child}
        </div>
      ))}
    </div>
  )
}

export function SettingsDetailRow({
  label,
  description,
  value,
  onPress,
  action,
  disabled = false,
}: {
  label: string
  description?: string
  value?: string
  onPress?: () => void
  action?: ReactNode
  disabled?: boolean
}) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-text">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 self-center">
        {value && <span className="max-w-[10rem] truncate text-sm text-muted">{value}</span>}
        {action}
        {onPress && !disabled && (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted/40" aria-hidden="true" />
        )}
      </div>
    </>
  )

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        disabled={disabled}
        className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-slate-50/80 disabled:opacity-50"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">{content}</div>
  )
}

export function SettingsInfoRow({
  label,
  description,
  value,
}: {
  label: string
  description?: string
  value: string
}) {
  return (
    <SettingsDetailRow label={label} description={description} value={value} />
  )
}

/** @deprecated Use SettingsDetailRow */
export function SettingsValueRow({
  label,
  value,
  onPress,
  disabled = false,
}: {
  label: string
  value: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <SettingsDetailRow
      label={label}
      value={value}
      onPress={onPress}
      disabled={disabled}
    />
  )
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <SettingsDetailRow
      label={label}
      description={description}
      action={
        <IOSSwitch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-label={label}
        />
      }
    />
  )
}

export function SettingsActionRow({
  label,
  description,
  onPress,
  destructive = false,
  disabled = false,
}: {
  label: string
  description?: string
  onPress: () => void
  destructive?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`flex w-full flex-col items-start px-4 py-3 text-left transition hover:bg-slate-50/80 disabled:opacity-50 ${
        destructive ? 'text-danger' : 'text-text'
      }`}
    >
      <span className="text-[15px]">{label}</span>
      {description && (
        <span className={`mt-0.5 text-xs leading-relaxed ${destructive ? 'text-danger/70' : 'text-muted'}`}>
          {description}
        </span>
      )}
    </button>
  )
}

export function SettingsDivider() {
  return <div className="ml-4 h-px bg-slate-100" aria-hidden="true" />
}

export function SettingsInlineActions({ children }: { children: ReactNode }) {
  return <div className="mt-4 flex flex-wrap gap-2">{children}</div>
}

export function IOSSwitch({
  checked,
  onChange,
  disabled = false,
  'aria-label': ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  'aria-label'?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-light disabled:opacity-50 ${
        checked ? 'bg-primary-light' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

export function SettingsPickerSheet({
  open,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  open: boolean
  title: string
  options: Array<{ value: string; label: string; subtitle?: string }>
  selectedValue: string
  onSelect: (value: string) => void
  onClose: () => void
}) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[min(70dvh,420px)] w-full max-w-md flex-col rounded-t-2xl bg-surface shadow-2xl md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
        role="dialog"
        aria-label={title}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="font-semibold text-text">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-primary"
          >
            Listo
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto py-1">
          {options.map((option) => {
            const selected = option.value === selectedValue
            return (
              <li key={option.value || '__empty'}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option.value)
                    onClose()
                  }}
                  className={`flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 ${
                    selected ? 'bg-primary/5' : ''
                  }`}
                >
                  <span
                    className={`text-[15px] ${selected ? 'font-medium text-primary' : 'text-text'}`}
                  >
                    {option.label}
                  </span>
                  {option.subtitle && (
                    <span className="shrink-0 text-xs text-muted">{option.subtitle}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}

/** @deprecated Use SettingsPageShell */
export function SettingsPageLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return <SettingsPageShell title={title}>{children}</SettingsPageShell>
}
