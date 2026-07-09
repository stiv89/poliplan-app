import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useGuestExperience } from '@/features/guest/GuestExperienceContext'
import { Button } from '@/components/ui/Button'
import { formatUserSyncAt } from '@/utils/scheduleSaveStatus'
import { useSchedule } from '@/hooks/useSchedule'

type AuthStep = 'chooser' | 'login' | 'create'

function AccountCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[680px] overflow-hidden rounded-xl bg-surface ring-1 ring-slate-100/90">
      <div className="px-5 py-5 text-left">{children}</div>
    </div>
  )
}

export function SettingsAccountPanel() {
  const { user, loading, isConfigured, signInWithEmail, signInWithGoogle, signOut } = useAuth()
  const { requestScheduleSync } = useGuestExperience()
  const { settings } = useSchedule()
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    if (user) setAuthOpen(false)
  }, [user])

  if (!isConfigured) {
    return (
      <AccountCard>
        <h3 className="text-[15px] font-semibold text-text">Guardá y sincronizá tu horario</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Tu horario se guarda automáticamente en este dispositivo. La sincronización en la nube
          estará disponible cuando configures la conexión del proyecto.
        </p>
      </AccountCard>
    )
  }

  if (loading) {
    return (
      <AccountCard>
        <p className="text-sm text-muted">Cargando cuenta…</p>
      </AccountCard>
    )
  }

  if (user) {
    return (
      <AccountCard>
        <p className="text-[15px] font-semibold text-text">{user.email ?? 'Cuenta conectada'}</p>

        <div className="mt-2 flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
          <span className="text-sm font-medium text-text">Sincronizado</span>
        </div>

        <p className="mt-1.5 text-xs text-muted">
          {formatUserSyncAt(settings?.lastUserScheduleSyncAt ?? null)}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => requestScheduleSync()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-text transition hover:bg-slate-50"
          >
            Sincronizar ahora
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm font-medium text-muted transition hover:text-text"
          >
            Cerrar sesión
          </button>
        </div>
      </AccountCard>
    )
  }

  return (
    <>
      <AccountCard>
        <h3 className="text-[15px] font-semibold text-text">Guardá y sincronizá tu horario</h3>
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">
          Iniciá sesión para acceder a tu horario desde otros dispositivos y mantener una copia
          segura.
        </p>

        <Button className="mt-4 justify-center sm:w-auto" onClick={() => setAuthOpen(true)}>
          Iniciar sesión o crear cuenta
        </Button>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Tu horario actual seguirá disponible en este dispositivo.
        </p>
      </AccountCard>

      <AuthAccountModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignInWithEmail={signInWithEmail}
        onSignInWithGoogle={signInWithGoogle}
      />
    </>
  )
}

function AuthAccountModal({
  open,
  onClose,
  onSignInWithEmail,
  onSignInWithGoogle,
}: {
  open: boolean
  onClose: () => void
  onSignInWithEmail: (email: string) => Promise<{ error: string | null }>
  onSignInWithGoogle: () => Promise<{ error: string | null }>
}) {
  const [step, setStep] = useState<AuthStep>('chooser')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setStep('chooser')
      setEmail('')
      setError(null)
      setStatus(null)
      setSubmitting(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  async function handleGoogle() {
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await onSignInWithGoogle()
    setSubmitting(false)
    if (signInError) setError(signInError)
  }

  async function handleEmailSubmit(mode: 'login' | 'create') {
    setSubmitting(true)
    setError(null)
    setStatus(null)
    const { error: signInError } = await onSignInWithEmail(email)
    setSubmitting(false)
    if (signInError) {
      setError(signInError)
      return
    }
    setStatus(
      mode === 'create'
        ? 'Revisá tu correo para completar el registro.'
        : 'Revisá tu correo para completar el inicio de sesión.',
    )
  }

  const title =
    step === 'chooser'
      ? 'Accedé a tu cuenta'
      : step === 'login'
        ? 'Iniciar sesión'
        : 'Crear cuenta'

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        role="dialog"
        aria-labelledby="auth-account-title"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {step !== 'chooser' && (
              <button
                type="button"
                onClick={() => {
                  setStep('chooser')
                  setError(null)
                  setStatus(null)
                }}
                className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Volver
              </button>
            )}
            <h2 id="auth-account-title" className="text-base font-semibold text-text">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {step === 'chooser' ? (
          <div className="mt-4 space-y-2.5">
            <AuthProviderButton
              label="Continuar con Google"
              onClick={() => void handleGoogle()}
              disabled={submitting}
              icon={<GoogleIcon />}
            />
            <AuthProviderButton
              label="Continuar con correo"
              onClick={() => {
                setStep('login')
                setError(null)
                setStatus(null)
              }}
              disabled={submitting}
            />
            <button
              type="button"
              onClick={() => {
                setStep('create')
                setError(null)
                setStatus(null)
              }}
              className="mt-1 w-full py-1.5 text-center text-sm font-medium text-primary hover:underline"
            >
              Crear una cuenta
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <label className="block text-xs text-muted" htmlFor="auth-account-email">
              Correo electrónico
            </label>
            <input
              id="auth-account-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              autoComplete="email"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-light"
            />
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            {status && <p className="mt-2 text-xs text-success">{status}</p>}
            <Button
              className="mt-4 w-full justify-center"
              onClick={() => void handleEmailSubmit(step)}
              disabled={submitting || !email.trim()}
            >
              {submitting
                ? 'Enviando…'
                : step === 'create'
                  ? 'Crear cuenta'
                  : 'Iniciar sesión'}
            </Button>
            {step === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setStep('create')
                  setError(null)
                  setStatus(null)
                }}
                className="mt-3 w-full text-center text-xs text-muted hover:text-text"
              >
                ¿No tenés cuenta? Crear una cuenta
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStep('login')
                  setError(null)
                  setStatus(null)
                }}
                className="mt-3 w-full text-center text-xs text-muted hover:text-text"
              >
                ¿Ya tenés cuenta? Iniciar sesión
              </button>
            )}
          </div>
        )}

        {step === 'chooser' && error && <p className="mt-3 text-xs text-danger">{error}</p>}
      </div>
    </>
  )
}

function AuthProviderButton({
  label,
  onClick,
  disabled = false,
  icon,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-text transition hover:bg-slate-50 disabled:opacity-50"
    >
      {icon}
      {label}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

/** @deprecated Use SettingsAccountPanel inside SettingsPage */
export function SettingsAccountSection() {
  return <SettingsAccountPanel />
}
