import { useEffect, useRef, useState } from 'react'
import { Info, X } from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import type { GradingScale } from '@/utils/grading'
import { formatDateTime } from '@/utils/dates'

export function GradingScalePopover({ scale }: { scale: GradingScale }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-text"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        Basado en la escala oficial FP-UNA
      </button>

      <AnimatedPopover
        open={open}
        anchorRef={buttonRef}
        popoverRef={popoverRef}
        align="left"
        className="w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-text">{scale.name}</p>
            <p className="mt-1 text-xs text-muted">{scale.institution}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-muted hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <dl className="mt-3 space-y-2 text-xs">
          <div>
            <dt className="text-muted">Fuente</dt>
            <dd className="text-text">{scale.sourceFile}</dd>
          </div>
          <div>
            <dt className="text-muted">Actualización</dt>
            <dd className="text-text">{formatDateTime(scale.extractedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Combinaciones</dt>
            <dd className="text-text">{scale.totalCombinations} pares PP/EF</dd>
          </div>
        </dl>
      </AnimatedPopover>
    </>
  )
}
