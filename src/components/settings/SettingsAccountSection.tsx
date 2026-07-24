import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { FEATURE_FLAGS } from '@/config/features'
import { isEmailRateLimitError, toAuthErrorMessage } from '@/utils/authErrors'
import { useAuth } from '@/features/auth/AuthContext'
import { useGuestExperience } from '@/features/guest/GuestExperienceContext'
import { Button } from '@/components/ui/Button'
import { formatUserSyncAt } from '@/utils/scheduleSaveStatus'
import { useSchedule } from '@/hooks/useSchedule'

type AuthStep = 'login' | 'create' | 'verify-otp'

function AccountCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[680px] overflow-hidden rounded-xl bg-surface ring-1 ring-slate-100/90">
      <div className="px-5 py-5 text-left">{children}</div>
    </div>
  )
}

export function SettingsAccountPanel() {
  const {
    user,
    loading,
    isConfigured,
    signInWithPassword,
    signUp,
    verifySignupOtp,
    resendSignupOtp,
    signOut,
  } = useAuth()
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
          {FEATURE_FLAGS.authSignupEnabled
            ? 'Iniciá sesión para acceder a tu horario desde otros dispositivos y mantener una copia segura.'
            : 'Si ya tenés cuenta, iniciá sesión para sincronizar. El registro de cuentas nuevas está temporalmente pausado.'}
        </p>

        <Button className="mt-4 justify-center sm:w-auto" onClick={() => setAuthOpen(true)}>
          Iniciar sesión
        </Button>

        {!FEATURE_FLAGS.authSignupEnabled && (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Pronto vas a poder crear una cuenta. Mientras tanto tu horario sigue guardado en este
            dispositivo.
          </p>
        )}

        {FEATURE_FLAGS.authSignupEnabled && (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Tu horario actual seguirá disponible en este dispositivo.
          </p>
        )}
      </AccountCard>

      <AuthAccountModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignInWithPassword={signInWithPassword}
        onSignUp={signUp}
        onVerifySignupOtp={verifySignupOtp}
        onResendSignupOtp={resendSignupOtp}
      />
    </>
  )
}

function AuthAccountModal({
  open,
  onClose,
  onSignInWithPassword,
  onSignUp,
  onVerifySignupOtp,
  onResendSignupOtp,
}: {
  open: boolean
  onClose: () => void
  onSignInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailVerification: boolean }>
  onSignUp: (input: {
    email: string
    password: string
    name: string
  }) => Promise<{ error: string | null; needsVerification: boolean }>
  onVerifySignupOtp: (email: string, token: string) => Promise<{ error: string | null }>
  onResendSignupOtp: (email: string) => Promise<{ error: string | null }>
}) {
  const [step, setStep] = useState<AuthStep>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (!open) {
      setStep('login')
      setName('')
      setEmail('')
      setPassword('')
      setOtp('')
      setError(null)
      setStatus(null)
      setSubmitting(false)
    }
  }, [open])

  function startResendCooldown(seconds = 60) {
    setResendCooldown(seconds)
  }

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  async function handleLogin() {
    setSubmitting(true)
    setError(null)
    setStatus(null)
    const { error: signInError, needsEmailVerification } = await onSignInWithPassword(
      email,
      password,
    )
    setSubmitting(false)
    if (signInError) {
      setError(toAuthErrorMessage(signInError))
      if (needsEmailVerification) {
        setStep('verify-otp')
        setOtp('')
        setStatus('Ingresá el código de 6 dígitos que te enviamos por correo.')
      }
      return
    }
    onClose()
  }

  async function handleSignUp() {
    setSubmitting(true)
    setError(null)
    setStatus(null)
    const { error: signUpError, needsVerification } = await onSignUp({ email, password, name })
    setSubmitting(false)
    if (signUpError) {
      setError(toAuthErrorMessage(signUpError))
      if (isEmailRateLimitError(signUpError)) startResendCooldown(300)
      return
    }
    if (needsVerification) {
      setStep('verify-otp')
      setOtp('')
      setStatus('Te enviamos un código a tu correo. Ingresalo para confirmar tu cuenta.')
      return
    }
    onClose()
  }

  async function handleVerifyOtp() {
    setSubmitting(true)
    setError(null)
    setStatus(null)
    const { error: verifyError } = await onVerifySignupOtp(email, otp)
    setSubmitting(false)
    if (verifyError) {
      setError(toAuthErrorMessage(verifyError))
      return
    }
    onClose()
  }

  async function handleResendOtp() {
    setSubmitting(true)
    setError(null)
    const { error: resendError } = await onResendSignupOtp(email)
    setSubmitting(false)
    if (resendError) {
      setError(toAuthErrorMessage(resendError))
      if (isEmailRateLimitError(resendError)) startResendCooldown(300)
      return
    }
    startResendCooldown(60)
    setStatus('Te enviamos un código nuevo.')
  }

  const title =
    step === 'login' ? 'Iniciar sesión' : step === 'create' ? 'Crear cuenta' : 'Confirmá tu correo'

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
            {step !== 'login' && (
              <button
                type="button"
                onClick={() => {
                  setStep(step === 'verify-otp' ? 'create' : 'login')
                  setError(null)
                  setStatus(null)
                  setOtp('')
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

        {step === 'login' && (
          <div className="mt-4 space-y-3">
            <AuthField
              id="auth-login-email"
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="tu@correo.com"
            />
            <AuthField
              id="auth-login-password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button
              className="w-full justify-center"
              onClick={() => void handleLogin()}
              disabled={submitting || !email.trim() || !password}
            >
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </Button>
            {FEATURE_FLAGS.authSignupEnabled ? (
              <button
                type="button"
                onClick={() => {
                  setStep('create')
                  setError(null)
                  setStatus(null)
                }}
                className="w-full text-center text-xs text-muted hover:text-text"
              >
                ¿No tenés cuenta? Crear una cuenta
              </button>
            ) : (
              <p className="text-center text-xs leading-relaxed text-muted">
                El registro está pausado por ahora. Si ya tenés cuenta, podés iniciar sesión.
              </p>
            )}
          </div>
        )}

        {FEATURE_FLAGS.authSignupEnabled && step === 'create' && (
          <div className="mt-4 space-y-3">
            <AuthField
              id="auth-create-name"
              label="Nombre"
              type="text"
              value={name}
              onChange={setName}
              autoComplete="name"
              placeholder="Tu nombre"
            />
            <AuthField
              id="auth-create-email"
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="tu@correo.com"
            />
            <AuthField
              id="auth-create-password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            {status && <p className="text-xs text-success">{status}</p>}
            <Button
              className="w-full justify-center"
              onClick={() => void handleSignUp()}
              disabled={submitting || !name.trim() || !email.trim() || !password}
            >
              {submitting ? 'Creando…' : 'Crear cuenta'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep('login')
                setError(null)
                setStatus(null)
              }}
              className="w-full text-center text-xs text-muted hover:text-text"
            >
              ¿Ya tenés cuenta? Iniciar sesión
            </button>
          </div>
        )}

        {step === 'verify-otp' && (
          <div className="mt-4 space-y-3">
            <p className="text-sm leading-relaxed text-muted">
              Enviamos un código de 6 dígitos a <strong className="text-text">{email}</strong>.
              Ingresalo para activar tu cuenta.
            </p>
            <AuthField
              id="auth-verify-otp"
              label="Código de verificación"
              type="text"
              value={otp}
              onChange={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="123456"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            {status && <p className="text-xs text-success">{status}</p>}
            <Button
              className="w-full justify-center"
              onClick={() => void handleVerifyOtp()}
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? 'Verificando…' : 'Confirmar cuenta'}
            </Button>
            <button
              type="button"
              onClick={() => void handleResendOtp()}
              disabled={submitting || resendCooldown > 0}
              className="w-full text-center text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resendCooldown > 0
                ? `Reenviar código (${resendCooldown}s)`
                : 'Reenviar código'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function AuthField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  inputMode,
}: {
  id: string
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
  inputMode?: 'numeric' | 'text' | 'email'
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-xs text-muted">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-light"
      />
    </label>
  )
}

/** @deprecated Use SettingsAccountPanel inside SettingsPage */
export function SettingsAccountSection() {
  return <SettingsAccountPanel />
}
