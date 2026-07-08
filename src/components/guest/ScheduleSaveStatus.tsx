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
}

export function ScheduleSaveStatus({
  isOnline,
  isAuthenticated,
  localSaveState,
  userSyncAt,
  officialDataSyncing,
  onSync,
  compact = false,
}: ScheduleSaveStatusProps) {
  const status = getScheduleSaveStatus({
    isOnline,
    isAuthenticated,
    localSaveState,
    userSyncAt,
    officialDataSyncing,
  })

  return (
    <div
      className={`flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'} text-muted`}
    >
      {status.showSyncedCheck && (
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
      )}
      <span className="truncate">{status.label}</span>
      {status.showSyncAction && onSync && isOnline && (
        <button
          type="button"
          onClick={onSync}
          className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
        >
          <Cloud className="h-3 w-3" aria-hidden="true" />
          Sincronizar
        </button>
      )}
    </div>
  )
}
