import { useEffect, useState, type RefObject } from 'react'
import { Check, Copy, Loader2 } from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'

export function ShareSchedulePopover({
  open,
  anchorRef,
  popoverRef,
  url,
  loading,
  onClose,
}: {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  popoverRef: RefObject<HTMLDivElement | null>
  url: string | null
  loading: boolean
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  async function copyLink() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiá este link:', url)
    }
  }

  return (
    <AnimatedPopover
      open={open}
      anchorRef={anchorRef}
      popoverRef={popoverRef}
      align="right"
      offset={8}
      className="w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg"
    >
      <div className="p-4">
        <p className="text-[13px] font-semibold text-text">Compartir horario</p>
        <p className="mt-1 text-[12px] leading-snug text-muted">
          Cualquiera con el link puede verlo y duplicarlo. No hace falta iniciar sesión.
        </p>

        {loading ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Generando link…
          </div>
        ) : url ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="break-all text-[11px] leading-relaxed text-slate-700">{url}</p>
          </div>
        ) : null}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={!url || loading}
            onClick={() => void copyLink()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12px] font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copiar link
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-[12px] font-medium text-muted transition hover:bg-slate-100 hover:text-text"
          >
            Listo
          </button>
        </div>
      </div>
    </AnimatedPopover>
  )
}
