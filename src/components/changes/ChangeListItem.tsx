import { CheckCheck } from 'lucide-react'
import type { ScheduleChange } from '@/types/academic'
import {
  formatChangeDetectedAt,
  getActivityDetail,
  getChangeSummary,
  SEVERITY_BADGE,
} from '@/utils/changes'

interface ChangeListItemProps {
  change: ScheduleChange
  onOpen: () => void
  onMarkSeen: () => void
}

export function ChangeListItem({ change, onOpen, onMarkSeen }: ChangeListItemProps) {
  const badge = SEVERITY_BADGE[change.severity]
  const detail = getActivityDetail(change)
  const isCritical = change.severity === 'critical'

  return (
    <article
      className={`flex items-start gap-2 border-b border-slate-50 py-2.5 last:border-b-0 ${
        change.seen ? 'opacity-65' : ''
      } ${isCritical && !change.seen ? 'border-l-2 border-l-amber-400 pl-2' : ''}`}
    >
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="truncate text-sm font-medium text-text">{change.courseName}</h3>
          {badge && (
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-800">
              {badge}
            </span>
          )}
          {!change.seen && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="No leída" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-text">{getChangeSummary(change)}</p>
        {detail && <p className="mt-0.5 truncate text-xs text-muted">{detail}</p>}
        <p className="mt-1 text-[11px] text-muted/80">{formatChangeDetectedAt(change.detectedAt)}</p>
      </button>

      {!change.seen && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onMarkSeen()
          }}
          className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted hover:bg-slate-100"
          aria-label="Marcar como vista"
          title="Marcar como vista"
        >
          <CheckCheck className="h-3.5 w-3.5" />
        </button>
      )}
    </article>
  )
}
