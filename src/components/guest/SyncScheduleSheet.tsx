import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SyncScheduleSheetProps {
  open: boolean
  onClose: () => void
  onCreateAccount: () => void
  onDismiss: () => void
}

export function SyncScheduleSheet({
  open,
  onClose,
  onCreateAccount,
  onDismiss,
}: SyncScheduleSheetProps) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(420px,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border"
        role="dialog"
        aria-labelledby="sync-sheet-title"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3 md:border-b-0 md:px-5 md:pt-5">
          <div className="min-w-0 pr-4">
            <h2 id="sync-sheet-title" className="text-base font-semibold text-text">
              Llevá tu horario a todos tus dispositivos
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tu horario ya está guardado en este dispositivo. Creá una cuenta para respaldarlo y
              recuperarlo desde otro celular o computadora.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-4 py-4 md:px-5 md:pb-5">
          <Button className="justify-center" onClick={onCreateAccount}>
            Crear cuenta y sincronizar
          </Button>
          <Button variant="secondary" className="justify-center" onClick={onDismiss}>
            Ahora no
          </Button>
        </div>
      </div>
    </>
  )
}
