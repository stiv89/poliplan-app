import { X } from 'lucide-react'

export function ScheduleUndoToast({
  scheduleName,
  onUndo,
  onDismiss,
}: {
  scheduleName: string
  onUndo: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed bottom-24 left-4 right-4 z-[70] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-surface px-4 py-3 shadow-lg md:bottom-6">
      <p className="text-sm text-text">
        <span className="font-medium">{scheduleName}</span> movido a la papelera
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
          onClick={onUndo}
        >
          Deshacer
        </button>
        <button
          type="button"
          className="rounded-lg p-1.5 text-muted hover:bg-slate-100"
          aria-label="Cerrar aviso"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
