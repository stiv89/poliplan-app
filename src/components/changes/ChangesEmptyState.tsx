import { Bell, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-6 text-center md:text-left">
      <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-4">
        <span className="inline-flex rounded-full bg-emerald-100 p-2.5 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-text">Todo al día</h2>
          <p className="mt-1 text-sm text-muted">
            No hay cambios recientes en tus materias ni exámenes.
          </p>
          <p className="mt-2 text-xs text-muted">{lastReviewLabel}</p>
          {!isOnline && (
            <p className="mt-1 text-xs text-amber-700">Usando datos guardados</p>
          )}
          {onSync && isOnline && (
            <Button
              variant="secondary"
              className="mt-4 justify-center"
              onClick={onSync}
              disabled={syncing}
            >
              {syncing ? 'Buscando…' : 'Buscar actualizaciones'}
            </Button>
          )}
        </div>
        <Bell className="hidden h-5 w-5 text-muted/40 md:block" aria-hidden="true" />
      </div>
    </div>
  )
}
