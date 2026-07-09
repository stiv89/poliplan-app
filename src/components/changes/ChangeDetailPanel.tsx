import { ExternalLink, X } from 'lucide-react'
import { OFFICIAL_SCHEDULE_SOURCE_URL } from '@/config/constants'
import type { ScheduleChange } from '@/types/academic'
import {
  formatChangeDetectedAt,
  formatChangeValue,
  getChangeFieldTitle,
  getChangeSummary,
} from '@/utils/changes'

interface ChangeDetailPanelProps {
  change: ScheduleChange
  onClose: () => void
  onMarkSeen: () => void
}

export function ChangeDetailPanel({ change, onClose, onMarkSeen }: ChangeDetailPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-text">{change.courseName}</h2>
          <p className="mt-0.5 text-xs text-muted">
            Sección {change.sectionCode} · {getChangeFieldTitle(change.field)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-slate-100"
          aria-label="Cerrar detalle"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="text-sm text-text">{getChangeSummary(change)}</p>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <ValueBlock label="Antes" value={formatChangeValue(change.field, change.previousValue)} />
          <ValueBlock label="Ahora" value={formatChangeValue(change.field, change.newValue)} emphasized />
        </div>

        <p className="mt-3 text-xs text-muted">{formatChangeDetectedAt(change.detectedAt)}</p>

        <a
          href={OFFICIAL_SCHEDULE_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Ver fuente oficial
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <div className="shrink-0 border-t border-slate-100 p-3">
        {!change.seen ? (
          <button
            type="button"
            onClick={onMarkSeen}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Marcar como vista
          </button>
        ) : (
          <p className="text-center text-xs text-muted">Ya marcaste esta novedad como vista.</p>
        )}
      </div>
    </div>
  )
}

function ValueBlock({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: string
  emphasized?: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-0.5 text-sm ${emphasized ? 'font-semibold text-text' : 'text-muted line-through'}`}>
        {value}
      </p>
    </div>
  )
}
