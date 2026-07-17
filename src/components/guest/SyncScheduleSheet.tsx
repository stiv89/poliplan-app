import { X } from 'lucide-react'
import desktopPhoto from '../../../logos/desktop.png'
import mobilePhoto from '../../../logos/mobile.png'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/ui/BottomSheet'

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
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Llevá tu horario a todos tus dispositivos"
      bare
      showHandle
      desktop="modal"
      maxHeight="88dvh"
      panelClassName="md:grid md:max-h-[min(520px,88dvh)] md:w-[min(760px,calc(100vw-2rem))] md:grid-cols-[42fr_58fr] md:overflow-hidden md:rounded-2xl md:border md:border-slate-200"
    >
      <div className="contents">
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
    </BottomSheet>
  )
}
