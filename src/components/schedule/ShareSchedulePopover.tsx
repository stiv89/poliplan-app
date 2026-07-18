import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import {
  Check,
  Download,
  Image as ImageIcon,
  Link2,
  Loader2,
} from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { CourseSection } from '@/types/academic'
import {
  buildScheduleShareBlocks,
  copyImageBlob,
  downloadImageBlob,
  renderScheduleShareImage,
  slugifyFilename,
} from '@/utils/scheduleShareImage'

export interface ScheduleShareData {
  scheduleName: string
  subtitle?: string | null
  selectedSections: CourseSection[]
  coursesById: Map<string, { name: string; code?: string | null }>
}

type ShareStatus = 'idle' | 'working' | 'copied-image' | 'downloaded' | 'copied-link' | 'error'

export function ShareSchedulePopover({
  open,
  anchorRef,
  popoverRef,
  presentation = 'popover',
  shareData,
  url,
  linkLoading,
  onRequestLink,
  onClose,
}: {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  popoverRef: RefObject<HTMLDivElement | null>
  presentation?: 'popover' | 'sheet'
  shareData: ScheduleShareData
  url: string | null
  linkLoading: boolean
  onRequestLink: () => Promise<string | null>
  onClose: () => void
}) {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStatus('idle')
      setError(null)
    }
  }, [open])

  async function exportImage(mode: 'copy' | 'download') {
    setStatus('working')
    setError(null)
    try {
      const blocks = buildScheduleShareBlocks(
        shareData.selectedSections,
        shareData.coursesById,
      )
      const blob = await renderScheduleShareImage({
        scheduleName: shareData.scheduleName,
        subtitle: shareData.subtitle,
        blocks,
      })

      if (mode === 'copy') {
        const ok = await copyImageBlob(blob)
        if (!ok) {
          downloadImageBlob(blob, `${slugifyFilename(shareData.scheduleName)}.png`)
          setStatus('downloaded')
          setError('No se pudo copiar. Se descargó la imagen.')
          window.setTimeout(() => {
            setStatus('idle')
            setError(null)
          }, 2500)
          return
        }
        setStatus('copied-image')
      } else {
        downloadImageBlob(blob, `${slugifyFilename(shareData.scheduleName)}.png`)
        setStatus('downloaded')
      }
      window.setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setError('No se pudo generar la imagen del horario.')
      window.setTimeout(() => {
        setStatus('idle')
        setError(null)
      }, 2500)
    }
  }

  async function handleCopyLink() {
    setStatus('working')
    setError(null)
    try {
      const nextUrl = url ?? (await onRequestLink())
      if (!nextUrl) {
        setStatus('error')
        setError('No se pudo generar el enlace.')
        return
      }
      try {
        await navigator.clipboard.writeText(nextUrl)
      } catch {
        window.prompt('Copiá este link:', nextUrl)
      }
      setStatus('copied-link')
      window.setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setError('No se pudo generar el enlace.')
      window.setTimeout(() => {
        setStatus('idle')
        setError(null)
      }, 2500)
    }
  }

  const busy = status === 'working' || linkLoading
  const hasClasses = shareData.selectedSections.length > 0

  const body = (
    <div className={presentation === 'sheet' ? 'px-4 pb-4 pt-1' : 'p-4'}>
      <p className="text-[13px] font-semibold text-text">Compartir horario</p>
      <p className="mt-1 text-[12px] leading-snug text-muted">
        Exportá una imagen con los días y materias, o compartí un enlace.
      </p>

      <div className="mt-3 flex flex-col gap-1.5">
        <ShareActionButton
          disabled={!hasClasses || busy}
          onClick={() => void exportImage('copy')}
          icon={
            status === 'copied-image' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : status === 'working' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
            )
          }
          label={status === 'copied-image' ? 'Imagen copiada' : 'Copiar imagen'}
          description="Días y materias con horario"
          primary
        />
        <ShareActionButton
          disabled={!hasClasses || busy}
          onClick={() => void exportImage('download')}
          icon={
            status === 'downloaded' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )
          }
          label={status === 'downloaded' ? 'Descargada' : 'Descargar imagen'}
        />
        <ShareActionButton
          disabled={busy}
          onClick={() => void handleCopyLink()}
          icon={
            status === 'copied-link' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : linkLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Link2 className="h-4 w-4" aria-hidden="true" />
            )
          }
          label={status === 'copied-link' ? 'Enlace copiado' : 'Copiar enlace'}
          description="Para ver y duplicar en PoliPlan"
        />
      </div>

      {(url || linkLoading) && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          {linkLoading ? (
            <p className="flex items-center gap-2 text-[11px] text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Generando link…
            </p>
          ) : (
            <p className="break-all text-[11px] leading-relaxed text-slate-700">{url}</p>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-[11px] text-amber-700">{error}</p>}
      {!hasClasses && (
        <p className="mt-2 text-[11px] text-muted">
          Agregá al menos una materia para exportar la imagen.
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-lg px-3 py-2 text-[12px] font-medium text-muted transition hover:bg-slate-100 hover:text-text"
      >
        Cerrar
      </button>
    </div>
  )

  if (presentation === 'sheet') {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        ariaLabel="Compartir horario"
        bare
        showHandle
        maxHeight="70dvh"
        className="p-0"
      >
        {body}
      </BottomSheet>
    )
  }

  return (
    <AnimatedPopover
      open={open}
      anchorRef={anchorRef}
      popoverRef={popoverRef}
      align="right"
      offset={8}
      className="w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-lg"
    >
      {body}
    </AnimatedPopover>
  )
}

function ShareActionButton({
  icon,
  label,
  description,
  onClick,
  disabled,
  primary = false,
}: {
  icon: ReactNode
  label: string
  description?: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
        primary
          ? 'bg-primary text-white hover:bg-primary/90'
          : 'border border-slate-200 bg-white text-text hover:bg-slate-50'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          primary ? 'bg-white/15' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">{label}</span>
        {description && (
          <span
            className={`mt-0.5 block text-[11px] ${
              primary ? 'text-white/75' : 'text-muted'
            }`}
          >
            {description}
          </span>
        )}
      </span>
    </button>
  )
}
