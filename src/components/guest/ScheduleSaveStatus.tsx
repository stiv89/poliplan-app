import { Check, Cloud } from 'lucide-react'
import { getScheduleSaveStatus, type LocalSaveState } from '@/utils/scheduleSaveStatus'

interface ScheduleSaveStatusProps {
  isOnline: boolean
  isAuthenticated: boolean
  localSaveState: LocalSaveState
  userSyncAt: string | null
  officialDataSyncing: boolean
  onSync?: () => void
  compact?: boolean
  /** Oculta el estado rutinario (p. ej. "Guardado en este dispositivo") para ahorrar espacio. */
  hiddenUnlessNotable?: boolean
}

export function ScheduleSaveStatus({
  isOnline,
  isAuthenticated,
  localSaveState,
  userSyncAt,
  officialDataSyncing,
  onSync,
  compact = false,
  hiddenUnlessNotable = false,
}: ScheduleSaveStatusProps) {
  const status = getScheduleSaveStatus({
    isOnline,
    isAuthenticated,
    localSaveState,
    userSyncAt,
    officialDataSyncing,
  })

  const isRoutine =
    !status.showSyncAction &&
    !status.showSyncedCheck &&
    (status.label === 'Guardado en este dispositivo' ||
      status.label === 'Guardado' ||
      status.label === 'Sincronizado')

  if (hiddenUnlessNotable && isRoutine) {
    return null
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        compact ? 'text-[12px]' : 'text-[13px]'
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5 truncate text-slate-400">
        {status.showSyncedCheck && (
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500/80" aria-hidden="true" />
        )}
        {status.label}
      </span>
      {status.showSyncAction && onSync && isOnline && (
        <button
          type="button"
          onClick={onSync}
          className="inline-flex shrink-0 items-center gap-1 font-medium text-primary transition hover:text-primary/80"
        >
          <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
          Sincronizar
        </button>
      )}
    </div>
  )
}
