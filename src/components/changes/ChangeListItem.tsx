import { CheckCheck } from 'lucide-react'
import type { ScheduleChange } from '@/types/academic'
import {
  formatChangeDetectedAt,
  formatChangeValue,
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
  const isCritical = change.severity === 'critical'

  return (
    <article
      className={`border-b border-slate-100 py-4 last:border-b-0 ${
        change.seen ? 'opacity-70' : ''
      } ${isCritical && !change.seen ? 'border-l-2 border-l-amber-400 pl-3' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-text">{change.courseName}</h3>
            {badge && (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                {badge}
              </span>
            )}
            {!change.seen && (
              <span className="h-2 w-2 rounded-full bg-primary" aria-label="No leída" />
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">{getChangeSummary(change)}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <MiniValue label="Antes" value={formatChangeValue(change.field, change.previousValue)} />
            <MiniValue label="Ahora" value={formatChangeValue(change.field, change.newValue)} />
          </div>

          <p className="mt-2 text-xs text-muted">{formatChangeDetectedAt(change.detectedAt)}</p>
          <span className="mt-2 inline-block text-xs font-medium text-primary">Ver detalle</span>
        </button>

        {!change.seen && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onMarkSeen()
            }}
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-slate-100"
            aria-label="Marcar como vista"
            title="Marcar como vista"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  )
}

function MiniValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  )
}
