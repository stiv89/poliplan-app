import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'

interface NotificationPromptSheetProps {
  open: boolean
  onClose: () => void
  onEnable: () => void
  onDismiss: () => void
}

export function NotificationPromptSheet({
  open,
  onClose,
  onEnable,
  onDismiss,
}: NotificationPromptSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="¿Querés que te avisemos si algo cambia?"
      bare
      showHandle
      desktop="modal"
      maxHeight="85dvh"
      panelClassName="md:w-[min(420px,calc(100vw-2rem))]"
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3 md:border-b-0 md:px-5 md:pt-5">
        <div className="min-w-0 pr-4">
          <h2 id="notification-sheet-title" className="text-base font-semibold text-text">
            ¿Querés que te avisemos si algo cambia?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Recibí avisos cuando cambie una fecha, aula u horario de tus materias.
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
        <Button className="justify-center" onClick={onEnable}>
          Activar avisos
        </Button>
        <Button variant="secondary" className="justify-center" onClick={onDismiss}>
          Ahora no
        </Button>
      </div>
    </BottomSheet>
  )
}
