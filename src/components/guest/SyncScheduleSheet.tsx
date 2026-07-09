import { useRef } from 'react'
import { X } from 'lucide-react'
import desktopPhoto from '../../../logos/desktop.png'
import mobilePhoto from '../../../logos/mobile.png'
import { Button } from '@/components/ui/Button'
import { useFocusTrap } from '@/hooks/useFocusTrap'

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
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(open, panelRef, onClose)

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[min(520px,88dvh)] md:w-[min(760px,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:grid md:grid-cols-[42fr_58fr] md:rounded-2xl md:border md:border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-sheet-title"
      >
        <div className="relative hidden min-h-[340px] md:block">
          <img
            src={desktopPhoto}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/35 via-slate-900/10 to-slate-900/30"
            aria-hidden="true"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="relative h-40 shrink-0 overflow-hidden md:hidden">
            <img
              src={mobilePhoto}
              alt=""
              className="h-full w-full object-cover object-center"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-muted shadow-sm backdrop-blur-sm transition hover:bg-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="sync-sheet-title" className="text-lg font-semibold tracking-tight text-text">
                  Llevá tu horario a todos tus dispositivos
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Tu horario ya está guardado en este dispositivo. Creá una cuenta para respaldarlo y
                  acceder desde tu celular o computadora.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hidden shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-slate-100 md:block"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button className="justify-center" onClick={onCreateAccount}>
                Crear cuenta
              </Button>
              <Button variant="secondary" className="justify-center" onClick={onDismiss}>
                Ahora no
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
