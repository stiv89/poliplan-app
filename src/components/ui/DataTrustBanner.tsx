/**
 * DataTrustBanner / DataTrustFooter — metadata de procedencia de datos
 */
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { db } from '@/db/database'
import { useSchedule } from '@/hooks/useSchedule'
import { formatDateTime } from '@/utils/dates'

interface TrustInfo {
  version: number
  checksum: string | null
  downloadedAt: string
}

function formatTrustDatetime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-PY', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function useDataTrustInfo(): TrustInfo | null {
  const { activePeriod, syncStatus } = useSchedule()
  const [info, setInfo] = useState<TrustInfo | null>(null)

  useEffect(() => {
    if (!activePeriod) return

    db.localScheduleVersions
      .get(activePeriod.id)
      .then((record) => {
        if (record) {
          setInfo({
            version: record.version,
            checksum: record.checksum ?? null,
            downloadedAt: record.downloadedAt,
          })
        }
      })
      .catch(() => {})
  }, [activePeriod, syncStatus])

  return info
}

export { useDataTrustInfo }

/** Banner completo — para páginas secundarias. */
export function DataTrustBanner() {
  const info = useDataTrustInfo()
  if (!info) return null

  const isRecent =
    Date.now() - new Date(info.downloadedAt).getTime() < 7 * 24 * 60 * 60 * 1000

  return (
    <div
      className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs ${
        isRecent
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
      role="note"
      aria-label="Información de confianza de los datos"
    >
      {isRecent ? (
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <div className="space-y-0.5">
        <p className="font-medium">
          {isRecent ? 'Datos verificados' : 'Datos con más de 7 días'}
        </p>
        <p className="flex flex-wrap gap-x-3 opacity-80">
          <span>Versión {info.version}</span>
          {info.checksum && <span>SHA {info.checksum.slice(0, 8)}…</span>}
          <span>{formatTrustDatetime(info.downloadedAt)}</span>
        </p>
      </div>
    </div>
  )
}

/** Footer discreto — para el panel de resumen. */
export function DataTrustFooter({ lastUpdated }: { lastUpdated?: string | null }) {
  const info = useDataTrustInfo()
  if (!info && !lastUpdated) return null

  const isRecent = info
    ? Date.now() - new Date(info.downloadedAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : true

  const updatedLabel = lastUpdated
    ? formatDateTime(lastUpdated)
    : info
      ? formatTrustDatetime(info.downloadedAt)
      : null

  return (
    <footer className="border-t border-slate-100/80 pt-3 text-[11px] leading-relaxed text-muted">
      <div className="flex items-center gap-1.5">
        {isRecent ? (
          <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600/80" aria-hidden="true" />
        ) : (
          <ShieldAlert className="h-3 w-3 shrink-0 text-amber-600/80" aria-hidden="true" />
        )}
        <span className="text-slate-600">
          {isRecent ? 'Datos verificados' : 'Datos desactualizados'}
        </span>
        {info && <span className="text-muted">· v{info.version}</span>}
      </div>
      {updatedLabel && (
        <p className="mt-0.5 pl-[18px] text-muted">Actualizado {updatedLabel}</p>
      )}
    </footer>
  )
}
