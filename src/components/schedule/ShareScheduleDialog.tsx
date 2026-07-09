import { useEffect, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function ShareScheduleDialog({
  open,
  url,
  onClose,
}: {
  open: boolean
  url: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  if (!open) return null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiá este link:', url)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        role="dialog"
        aria-labelledby="share-schedule-title"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="share-schedule-title" className="text-base font-semibold text-text">
              Compartir horario
            </h2>
            <p className="mt-1 text-sm text-muted">
              Cualquiera con el link puede verlo y duplicarlo en su PoliPlan. No hace falta iniciar
              sesión.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="break-all text-xs leading-relaxed text-slate-700">{url}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" className="flex-1 justify-center" onClick={() => void copyLink()}>
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copiar link
              </>
            )}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Listo
          </Button>
        </div>
      </div>
    </>
  )
}
