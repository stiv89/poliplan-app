import type { ReactNode } from 'react'
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
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text">{change.courseName}</h2>
          <p className="mt-0.5 text-sm text-muted">
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

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-text">{getChangeSummary(change)}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ValueBlock label="Antes" value={formatChangeValue(change.field, change.previousValue)} />
          <ValueBlock label="Ahora" value={formatChangeValue(change.field, change.newValue)} emphasized />
        </div>

        <dl className="mt-5 space-y-2 text-sm">
          <DetailRow label="Detectado">{formatChangeDetectedAt(change.detectedAt)}</DetailRow>
          {change.versionFrom !== change.versionTo && (
            <DetailRow label="Versión de horarios">
              v{change.versionFrom} → v{change.versionTo}
            </DetailRow>
          )}
          <DetailRow label="Fuente">Oficial de la Facultad</DetailRow>
        </dl>

        <a
          href={OFFICIAL_SCHEDULE_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Ver fuente oficial
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      <div className="shrink-0 border-t border-slate-100 p-4">
        {!change.seen ? (
          <button
            type="button"
            onClick={onMarkSeen}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary/90"
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
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-sm ${emphasized ? 'font-semibold text-text' : 'text-muted line-through'}`}>
        {value}
      </p>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-text">{children}</dd>
    </div>
  )
}
