import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import type { AuthUser } from '@/features/settings/auth.types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isConfigured: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(user: { id: string; email?: string | null } | null): AuthUser | null {
  if (!user) return null
  return { id: user.id, email: user.email ?? null }
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
      signInWithEmail: async (email: string) => {
        if (!client) {
          return { error: 'Supabase no está configurado.' }
        }

        const trimmed = email.trim().toLowerCase()
        if (!trimmed.includes('@')) {
          return { error: 'Ingresá un correo válido.' }
        }

        const { error } = await client.auth.signInWithOtp({
          email: trimmed,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        })

        return { error: error?.message ?? null }
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
