import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { useGuestExperience } from '@/features/guest/GuestExperienceContext'
import { Button } from '@/components/ui/Button'
import { SettingsGroup, SettingsInfoRow } from '@/components/settings/SettingsList'
import { formatUserSyncAt } from '@/utils/scheduleSaveStatus'
import { useSchedule } from '@/hooks/useSchedule'

export function SettingsAccountPanel() {
  const { user, loading, isConfigured, signInWithEmail, signOut } = useAuth()
  const { requestScheduleSync } = useGuestExperience()
  const { settings } = useSchedule()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<'create' | 'login'>('create')

  if (!isConfigured) {
    return (
      <SettingsGroup>
        <div className="px-4 py-4">
          <p className="text-[15px] font-medium text-text">Sincronización entre dispositivos</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Tu horario se guarda automáticamente en este dispositivo. La sincronización en la nube
            estará disponible cuando configures la conexión del proyecto.
          </p>
        </div>
      </SettingsGroup>
    )
  }

  if (loading) {
    return (
      <SettingsGroup>
        <SettingsInfoRow label="Estado" value="Cargando…" />
      </SettingsGroup>
    )
  }

  if (user) {
    return (
      <SettingsGroup>
        <div className="px-4 py-4">
          <p className="text-[15px] font-medium text-text">Cuenta conectada</p>
          <p className="mt-1 text-sm text-muted">{user.email ?? 'Sesión activa'}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {formatUserSyncAt(settings?.lastUserScheduleSyncAt ?? null)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Tu horario se respalda en la nube y podés recuperarlo en otros dispositivos.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button className="justify-center" onClick={() => requestScheduleSync()}>
              Sincronizar horario ahora
            </Button>
            <Button variant="secondary" className="justify-center" onClick={() => void signOut()}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </SettingsGroup>
    )
  }

  return (
    <SettingsGroup>
      <div className="px-4 py-4">
        <p className="text-[15px] font-medium text-text">Sincronizá tu horario entre dispositivos</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Tu información actual está guardada en este dispositivo.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              mode === 'create' ? 'bg-primary text-white' : 'bg-slate-100 text-muted'
            }`}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              mode === 'login' ? 'bg-primary text-white' : 'bg-slate-100 text-muted'
            }`}
          >
            Iniciar sesión
          </button>
        </div>

        <label className="mt-4 block text-xs text-muted" htmlFor="settings-auth-email">
          Correo electrónico
        </label>
        <input
          id="settings-auth-email"
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
          onClick={() => {
            setSubmitting(true)
            setError(null)
            setStatus(null)
            void signInWithEmail(email).then(({ error: signInError }) => {
              setSubmitting(false)
              if (signInError) {
                setError(signInError)
                return
              }
              setStatus('Revisá tu correo para completar el inicio de sesión.')
            })
          }}
          disabled={submitting || !email.trim()}
        >
          {submitting
            ? 'Enviando…'
            : mode === 'create'
              ? 'Crear cuenta y sincronizar'
              : 'Iniciar sesión'}
        </Button>

        <button
          type="button"
          className="mt-3 w-full text-center text-xs text-muted hover:text-text"
          onClick={() => requestScheduleSync()}
        >
          Sincronizar horario
        </button>
      </div>
    </SettingsGroup>
  )
}

/** @deprecated Use SettingsAccountPanel inside SettingsPage */
export function SettingsAccountSection() {
  return <SettingsAccountPanel />
}
