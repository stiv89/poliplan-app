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
      className={`flex items-center gap-2 ${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-400`}
    >
      {status.showSyncedCheck && (
        <Check className="h-3 w-3 text-emerald-500/80" aria-hidden="true" />
      )}
      <span className="truncate">{status.label}</span>
      {status.showSyncAction && onSync && isOnline && (
        <button
          type="button"
          onClick={onSync}
          className="inline-flex shrink-0 items-center gap-1 text-slate-500 transition hover:text-primary/80"
        >
          <Cloud className="h-3 w-3" aria-hidden="true" />
          Sincronizar
        </button>
      )}
    </div>
  )
}
