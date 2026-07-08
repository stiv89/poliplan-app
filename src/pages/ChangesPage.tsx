import { useMemo, useState } from 'react'
import { ChangeDetailPanel } from '@/components/changes/ChangeDetailPanel'
import { ChangeListItem } from '@/components/changes/ChangeListItem'
import { ChangesEmptyState } from '@/components/changes/ChangesEmptyState'
import { ChangesFilterBar } from '@/components/changes/ChangesFilterBar'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/Button'
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

  const [filter, setFilter] = useState<ChangeFilter>('all')
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-100 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-text md:text-2xl">Novedades</h1>
            <p className="mt-0.5 text-sm text-muted">
              Cambios importantes en tus materias y exámenes.
            </p>
            <p className="mt-1 text-xs text-muted">{lastReviewLabel}</p>
            {!isOnline && (
              <p className="mt-1 text-xs text-amber-700">Usando datos guardados</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {isOnline && (
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => void handleSync()}
                disabled={syncing}
              >
                {syncing ? 'Buscando…' : 'Buscar actualizaciones'}
              </Button>
            )}
            {unseenCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllSeen()}
                className="text-xs text-primary hover:underline"
              >
                Marcar todas como vistas
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8">
          <div className="mx-auto max-w-3xl space-y-5">
            {changes.length === 0 ? (
              <ChangesEmptyState
                lastReviewLabel={lastReviewLabel}
                onSync={() => void handleSync()}
                syncing={syncing}
                isOnline={isOnline}
              />
            ) : (
              <>
                <ChangesFilterBar value={filter} onChange={setFilter} />

                {filteredChanges.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">
                    No hay novedades en esta categoría.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {groups.map((group) => (
                      <section key={group.label}>
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {group.label}
                        </h2>
                        <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white px-4">
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
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {detailChange && (
          <aside className="hidden w-[min(360px,34vw)] shrink-0 border-l border-slate-100 bg-surface md:flex md:flex-col">
            <ChangeDetailPanel
              change={detailChange}
              onClose={() => setDetailChange(null)}
              onMarkSeen={() => void handleMarkSeen(detailChange.id)}
            />
          </aside>
        )}
      </div>

      {detailChange && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setDetailChange(null)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:hidden"
            role="dialog"
            aria-label="Detalle de novedad"
          >
            <ChangeDetailPanel
              change={detailChange}
              onClose={() => setDetailChange(null)}
              onMarkSeen={() => void handleMarkSeen(detailChange.id)}
            />
          </div>
        </>
      )}
    </div>
  )
}
