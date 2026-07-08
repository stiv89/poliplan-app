import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'

export function useProfileEmailPrefs() {
  const { user, loading: authLoading } = useAuth()
  const [notifyScheduleUpdates, setNotifyScheduleUpdates] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client || !user) {
      setNotifyScheduleUpdates(true)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('notify_schedule_updates')
          .eq('id', user.id)
          .maybeSingle()

        if (cancelled) return
        if (error) {
          console.warn('useProfileEmailPrefs', error.message)
          return
        }
        if (data?.notify_schedule_updates != null) {
          setNotifyScheduleUpdates(data.notify_schedule_updates)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  const setNotifyScheduleUpdatesPref = useCallback(async (enabled: boolean) => {
    const client = getSupabaseClient()
    if (!client || !user) return

    setNotifyScheduleUpdates(enabled)
    setSaving(true)

    const { error } = await client
      .from('profiles')
      .upsert({ id: user.id, notify_schedule_updates: enabled }, { onConflict: 'id' })

    setSaving(false)

    if (error) {
      console.warn('useProfileEmailPrefs update', error.message)
      setNotifyScheduleUpdates(!enabled)
    }
  }, [user])

  return {
    notifyScheduleUpdates,
    setNotifyScheduleUpdates: setNotifyScheduleUpdatesPref,
    loading: authLoading || loading,
    saving,
    canEdit: user != null,
  }
}
