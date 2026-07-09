interface ChangesEmptyStateProps {
  lastReviewLabel: string
  onSync?: () => void
  syncing?: boolean
  isOnline?: boolean
}

export function ChangesEmptyState({
  lastReviewLabel,
  onSync,
  syncing = false,
  isOnline = true,
}: ChangesEmptyStateProps) {
  return (
    <div className="py-10 text-center">
      <h2 className="text-sm font-semibold text-text">Todo al día</h2>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
        No hay cambios recientes en tus materias ni exámenes.
      </p>
      <p className="mt-2 text-xs text-muted">{lastReviewLabel}</p>
      {!isOnline && <p className="mt-1 text-xs text-amber-700">Sin conexión</p>}
      {onSync && isOnline && (
        <button
          type="button"
          onClick={onSync}
          disabled={syncing}
          className="mt-4 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-text transition hover:bg-slate-50 disabled:opacity-50"
        >
          {syncing ? 'Buscando…' : 'Buscar actualizaciones'}
        </button>
      )}
    </div>
  )
}
