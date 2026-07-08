import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { RemoteUserSchedule } from '@/services/userScheduleSyncService'
import type { ScheduleConflictResolution } from '@/services/userScheduleSyncService'

interface ScheduleConflictSheetProps {
  open: boolean
  localCount: number
  remote: RemoteUserSchedule
  onResolve: (resolution: ScheduleConflictResolution) => void
  onClose: () => void
}

export function ScheduleConflictSheet({
  open,
  localCount,
  remote,
  onResolve,
  onClose,
}: ScheduleConflictSheetProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[min(440px,calc(100vw-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:border"
        role="dialog"
        aria-labelledby="conflict-sheet-title"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3 md:px-5 md:pt-5">
          <div className="min-w-0 pr-4">
            <h2 id="conflict-sheet-title" className="text-base font-semibold text-text">
              Encontramos dos versiones de tu horario
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Este dispositivo tiene {localCount} materia{localCount === 1 ? '' : 's'} y tu cuenta
              tiene {remote.sectionIds.length} en la nube. Elegí cómo continuar.
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
          <Button className="justify-center" onClick={() => onResolve('local')}>
            Usar este dispositivo
          </Button>
          <Button variant="secondary" className="justify-center" onClick={() => onResolve('remote')}>
            Usar la versión de la nube
          </Button>
          <Button variant="secondary" className="justify-center" onClick={() => onResolve('merge')}>
            Combinar materias
          </Button>
        </div>
      </div>
    </>
  )
}
