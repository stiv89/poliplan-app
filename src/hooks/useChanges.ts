import { useCallback, useEffect, useState } from 'react'
import type { ScheduleChange } from '@/types/academic'
import {
  countUnseenChanges,
  loadChanges,
  markAllChangesSeen,
  markChangeSeen,
} from '@/services/changeDetectionService'

export interface UseChangesResult {
  changes: ScheduleChange[]
  unseenCount: number
  loading: boolean
  markSeen: (id: string) => Promise<void>
  markAllSeen: () => Promise<void>
  refresh: () => Promise<void>
}

export function useChanges(): UseChangesResult {
  const [changes, setChanges] = useState<ScheduleChange[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [all, count] = await Promise.all([loadChanges(), countUnseenChanges()])
      setChanges(all)
      setUnseenCount(count)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const markSeen = useCallback(
    async (id: string) => {
      await markChangeSeen(id)
      await refresh()
    },
    [refresh],
  )

  const markAllSeen = useCallback(async () => {
    await markAllChangesSeen()
    await refresh()
  }, [refresh])

  return { changes, unseenCount, loading, markSeen, markAllSeen, refresh }
}
