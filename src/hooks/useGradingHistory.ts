import { useCallback, useEffect, useState } from 'react'

export interface GradingHistoryEntry {
  pp: number
  ef: number | null
  grade: number | null
  savedAt: string
}

const STORAGE_KEY = 'poliplan-grading-history'
const MAX_ENTRIES = 3

function readHistory(): GradingHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GradingHistoryEntry[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : []
  } catch {
    return []
  }
}

export function useGradingHistory() {
  const [entries, setEntries] = useState<GradingHistoryEntry[]>([])

  useEffect(() => {
    setEntries(readHistory())
  }, [])

  const saveEntry = useCallback((entry: Omit<GradingHistoryEntry, 'savedAt'>) => {
    const next: GradingHistoryEntry[] = [
      { ...entry, savedAt: new Date().toISOString() },
      ...readHistory().filter(
        (existing) =>
          !(existing.pp === entry.pp && existing.ef === entry.ef && existing.grade === entry.grade),
      ),
    ].slice(0, MAX_ENTRIES)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setEntries(next)
  }, [])

  return { entries, saveEntry }
}
