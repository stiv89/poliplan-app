import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { FEATURE_FLAGS } from '@/config/features'
import { getSupabaseClient } from '@/lib/supabase'
import type { AuthUser } from '@/features/settings/auth.types'
import { formatAuthError, getAuthErrorCode } from '@/utils/authErrors'

interface SignUpResult {
  error: string | null
  needsVerification: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isConfigured: boolean
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailVerification: boolean }>
  signUp: (input: { email: string; password: string; name: string }) => Promise<SignUpResult>
  verifySignupOtp: (email: string, token: string) => Promise<{ error: string | null }>
  resendSignupOtp: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: { id: string; email?: string | null } | null): AuthUser | null {
  if (!user) return null
  return { id: user.id, email: user.email ?? null }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function validateEmail(email: string): string | null {
  const trimmed = normalizeEmail(email)
  if (!trimmed.includes('@')) return 'Ingresá un correo válido.'
  return null
}

function validatePassword(password: string): string | null {
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const client = getSupabaseClient()
  const isConfigured = client != null

  useEffect(() => {
    if (!client) {
      setLoading(false)
      return
    }

    let cancelled = false

    void client.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setUser(mapUser(data.session?.user ?? null))
        setLoading(false)
      }
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null))
      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [client])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured,
      signInWithPassword: async (email: string, password: string) => {
        if (!client) {
          return { error: 'Supabase no está configurado.', needsEmailVerification: false }
        }

        const emailError = validateEmail(email)
        if (emailError) return { error: emailError, needsEmailVerification: false }

        const passwordError = validatePassword(password)
        if (passwordError) return { error: passwordError, needsEmailVerification: false }

        const { error } = await client.auth.signInWithPassword({
          email: normalizeEmail(email),
          password,
        })

        if (!error) {
          return { error: null, needsEmailVerification: false }
        }

        const needsEmailVerification = getAuthErrorCode(error) === 'email_not_confirmed'
        return {
          error: formatAuthError(error),
          needsEmailVerification,
        }
      },
      signUp: async ({ email, password, name }) => {
        if (!FEATURE_FLAGS.authSignupEnabled) {
          return {
            error: 'El registro está temporalmente deshabilitado. Pronto vas a poder crear una cuenta.',
            needsVerification: false,
          }
        }

        if (!client) {
          return { error: 'Supabase no está configurado.', needsVerification: false }
        }

        const emailError = validateEmail(email)
        if (emailError) return { error: emailError, needsVerification: false }

        const passwordError = validatePassword(password)
        if (passwordError) return { error: passwordError, needsVerification: false }

        const trimmedName = name.trim()
        if (!trimmedName) {
          return { error: 'Ingresá tu nombre.', needsVerification: false }
        }

        const normalizedEmail = normalizeEmail(email)
        const { data, error } = await client.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { display_name: trimmedName },
            emailRedirectTo: `${window.location.origin}/`,
          },
        })

        if (error) {
          return { error: formatAuthError(error), needsVerification: false }
        }

        if (data.user?.identities?.length === 0) {
          return {
            error: 'Ya existe una cuenta con este correo. Iniciá sesión.',
            needsVerification: false,
          }
        }

        const needsVerification = !data.session && Boolean(data.user)
        return { error: null, needsVerification }
      },
      verifySignupOtp: async (email: string, token: string) => {
        if (!client) {
          return { error: 'Supabase no está configurado.' }
        }

        const emailError = validateEmail(email)
        if (emailError) return { error: emailError }

        const code = token.trim()
        if (!/^\d{6}$/.test(code)) {
          return { error: 'Ingresá el código de 6 dígitos.' }
        }

        const normalizedEmail = normalizeEmail(email)
        let lastError = 'No se pudo verificar el código.'

        for (const type of ['signup', 'email'] as const) {
          const { error } = await client.auth.verifyOtp({
            email: normalizedEmail,
            token: code,
            type,
          })
          if (!error) return { error: null }
          lastError = formatAuthError(error)
        }

        return { error: lastError }
      },
      resendSignupOtp: async (email: string) => {
        if (!client) {
          return { error: 'Supabase no está configurado.' }
        }

        const emailError = validateEmail(email)
        if (emailError) return { error: emailError }

        const { error } = await client.auth.resend({
          type: 'signup',
          email: normalizeEmail(email),
        })

        return { error: error ? formatAuthError(error) : null }
      },
      signOut: async () => {
        if (!client) return
        await client.auth.signOut()
      },
    }),
    [client, isConfigured, loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
