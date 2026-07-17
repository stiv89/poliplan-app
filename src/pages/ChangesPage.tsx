import { useMemo, useState } from 'react'
import { ChangeDetailPanel } from '@/components/changes/ChangeDetailPanel'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ChangeListItem } from '@/components/changes/ChangeListItem'
import { ChangesEmptyState } from '@/components/changes/ChangesEmptyState'
import { ChangesFilterBar } from '@/components/changes/ChangesFilterBar'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useDataTrustInfo } from '@/components/ui/DataTrustBanner'
import { useChanges } from '@/hooks/useChanges'
import { useSchedule } from '@/hooks/useSchedule'
import type { ScheduleChange } from '@/types/academic'
import {
  filterChanges,
  formatLastReview,
  groupChangesByRecency,
  type ChangeFilter,
} from '@/utils/changes'

export function ChangesPage() {
  const { changes, unseenCount, loading, markSeen, markAllSeen, refresh } = useChanges()
  const { selectedSections, lastUpdated, isOnline, syncNow } = useSchedule()
  const trustInfo = useDataTrustInfo()

  const [filter, setFilter] = useState<ChangeFilter>('mine')
  const [detailChange, setDetailChange] = useState<ScheduleChange | null>(null)
  const [syncing, setSyncing] = useState(false)

  const selectedSectionIds = useMemo(
    () => new Set(selectedSections.map((section) => section.id)),
    [selectedSections],
  )

  const lastReviewIso = lastUpdated ?? trustInfo?.downloadedAt ?? null
  const lastReviewLabel = formatLastReview(lastReviewIso)

  const filteredChanges = useMemo(
    () => filterChanges(changes, filter, selectedSectionIds),
    [changes, filter, selectedSectionIds],
  )

  const groups = useMemo(() => groupChangesByRecency(filteredChanges), [filteredChanges])

  const countLabel =
    filteredChanges.length === 0
      ? unseenCount > 0
        ? `${unseenCount} sin leer`
        : 'Sin novedades'
      : `${filteredChanges.length} novedad${filteredChanges.length !== 1 ? 'es' : ''}${
          unseenCount > 0 ? ` · ${unseenCount} sin leer` : ''
        }`

  const handleSync = async () => {
    if (!isOnline) return
    setSyncing(true)
    try {
      await syncNow(true)
      await refresh()
    } finally {
      setSyncing(false)
    }
  }

  const handleMarkSeen = async (id: string) => {
    await markSeen(id)
    if (detailChange?.id === id) {
      setDetailChange((current) => (current ? { ...current, seen: true } : null))
    }
  }

  if (loading && changes.length === 0) {
    return <LoadingState label="Cargando novedades…" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-200/50 bg-slate-50/45 px-4 py-2 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <h1 className="text-base font-bold tracking-tight text-text md:text-lg">Novedades</h1>
            <span className="text-xs text-muted">{countLabel}</span>
            <span className="hidden text-xs text-muted sm:inline">{lastReviewLabel}</span>
            {!isOnline && (
              <span className="text-[11px] text-amber-700 sm:ml-1">Sin conexión</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isOnline && (
              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={syncing}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-text transition hover:bg-slate-50 disabled:opacity-50"
              >
                {syncing ? 'Buscando…' : 'Actualizar'}
              </button>
            )}
            {unseenCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllSeen()}
                className="hidden rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-text transition hover:bg-slate-50 sm:inline-flex"
              >
                Marcar vistas
              </button>
            )}
          </div>
        </div>

        {changes.length > 0 && (
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <ChangesFilterBar value={filter} onChange={setFilter} />
            {unseenCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllSeen()}
                className="shrink-0 text-xs text-primary hover:underline sm:hidden"
              >
                Marcar vistas
              </button>
            )}
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4 ${
            changes.length === 0 ? 'flex items-center justify-center' : ''
          }`}
        >
          {changes.length === 0 ? (
            <ChangesEmptyState
              lastReviewLabel={lastReviewLabel}
              onSync={() => void handleSync()}
              syncing={syncing}
              isOnline={isOnline}
            />
          ) : (
            <div className="w-full max-w-lg space-y-4">
              {filteredChanges.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  No hay novedades en esta categoría.
                </p>
              ) : (
                groups.map((group) => (
                  <section key={group.label}>
                    <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {group.label}
                    </h2>
                    <div className="mt-1.5">
                      {group.changes.map((change) => (
                        <ChangeListItem
                          key={change.id}
                          change={change}
                          onOpen={() => setDetailChange(change)}
                          onMarkSeen={() => void handleMarkSeen(change.id)}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          )}
        </div>

        {detailChange && (
          <aside className="hidden w-[min(340px,32vw)] shrink-0 border-l border-slate-100 bg-surface md:flex md:flex-col">
            <ChangeDetailPanel
              change={detailChange}
              onClose={() => setDetailChange(null)}
              onMarkSeen={() => void handleMarkSeen(detailChange.id)}
            />
          </aside>
        )}
      </div>

      <BottomSheet
        open={detailChange != null}
        onClose={() => setDetailChange(null)}
        ariaLabel="Detalle de novedad"
        bare
        showHandle
        mobileOnly
        maxHeight="92dvh"
      >
        {detailChange ? (
          <ChangeDetailPanel
            change={detailChange}
            onClose={() => setDetailChange(null)}
            onMarkSeen={() => void handleMarkSeen(detailChange.id)}
          />
        ) : null}
      </BottomSheet>
    </div>
  )
}
