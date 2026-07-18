import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { registerBottomSheetOpen } from '@/lib/bottomSheetLayer'
import { useFocusTrap } from '@/hooks/useFocusTrap'

const DISMISS_FRACTION = 0.28
const FLICK_VELOCITY_PX_S = 900
const SPRING_MS = 420

type SheetPhase = 'closed' | 'entering' | 'open' | 'closing'

export type BottomSheetDesktopPresentation = 'sheet' | 'modal'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  ariaLabel: string
  title?: string
  /** Custom header; when set, default title row is omitted. */
  header?: ReactNode
  /** Show drag handle. Default true unless `header` is provided. */
  showHandle?: boolean
  /** Bare panel: no handle or title row — children supply chrome (e.g. Tus horarios). */
  bare?: boolean
  maxHeight?: string
  tall?: boolean
  className?: string
  panelClassName?: string
  /** On md+, render as centered modal instead of bottom sheet. */
  desktop?: BottomSheetDesktopPresentation
  /** Only render below md (desktop UI handled elsewhere). */
  mobileOnly?: boolean
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return reduced
}

function useIsMobileSheet(mobileOnly: boolean, desktop: BottomSheetDesktopPresentation) {
  const [isMobile, setIsMobile] = useState(() =>
    mobileOnly ? window.matchMedia('(max-width: 767px)').matches : true,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const sync = () => {
      if (mobileOnly) {
        setIsMobile(media.matches)
        return
      }
      setIsMobile(desktop === 'sheet' || media.matches)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [desktop, mobileOnly])

  return isMobile
}

export function BottomSheet({
  open,
  onClose,
  children,
  ariaLabel,
  title,
  header,
  showHandle,
  bare = false,
  maxHeight = '85dvh',
  tall = false,
  className = '',
  panelClassName = '',
  desktop = 'sheet',
  mobileOnly = false,
}: BottomSheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartScrollTop = useRef(0)
  const dragYRef = useRef(0)
  const dragStartTime = useRef(0)
  const isDraggingRef = useRef(false)
  const closeTimerRef = useRef<number | null>(null)

  const [mounted, setMounted] = useState(open)
  const [phase, setPhase] = useState<SheetPhase>(open ? 'entering' : 'closed')
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const reducedMotion = usePrefersReducedMotion()
  const isMobileSheet = useIsMobileSheet(mobileOnly, desktop)
  const isModalDesktop = !isMobileSheet && desktop === 'modal'

  useFocusTrap(mounted && phase !== 'closed', panelRef, onClose)

  const visibleDragY = dragY < 0 ? dragY * 0.18 : dragY

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const finishClose = useCallback(() => {
    clearCloseTimer()
    setMounted(false)
    setPhase('closed')
    setDragY(0)
    isDraggingRef.current = false
    setIsDragging(false)
  }, [clearCloseTimer])

  const startClosing = useCallback(() => {
    clearCloseTimer()
    if (reducedMotion) {
      finishClose()
      return
    }
    setPhase('closing')
    setDragY(0)
    closeTimerRef.current = window.setTimeout(finishClose, SPRING_MS)
  }, [clearCloseTimer, finishClose, reducedMotion])

  useEffect(() => {
    if (open) {
      clearCloseTimer()
      setMounted(true)
      setPhase('entering')
      setDragY(0)
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setPhase('open'))
      })
      return () => window.cancelAnimationFrame(frame)
    }

    if (mounted && phase !== 'closed' && phase !== 'closing') {
      startClosing()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mounted || phase === 'closed') return
    return registerBottomSheetOpen()
  }, [mounted, phase])

  useEffect(() => {
    if (!mounted || phase === 'closed') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mounted, phase])

  const handleDismiss = useCallback(() => {
    onClose()
  }, [onClose])

  const beginDrag = useCallback((clientY: number) => {
    dragStartY.current = clientY
    dragStartScrollTop.current = scrollRef.current?.scrollTop ?? 0
    dragStartTime.current = performance.now()
    dragYRef.current = 0
    isDraggingRef.current = true
    setIsDragging(true)
  }, [])

  const moveDrag = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return
    const delta = clientY - dragStartY.current
    const scrollTop = scrollRef.current?.scrollTop ?? 0

    if (scrollTop > 0 || delta < 0) {
      if (scrollTop <= 0 && delta < 0) {
        dragYRef.current = delta
        setDragY(delta)
      }
      return
    }

    dragYRef.current = Math.max(0, delta)
    setDragY(Math.max(0, delta))
  }, [])

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return

    const panelHeight = panelRef.current?.offsetHeight ?? window.innerHeight
    const elapsed = Math.max(performance.now() - dragStartTime.current, 1)
    const velocity = (dragYRef.current / elapsed) * 1000
    const shouldDismiss =
      dragYRef.current > panelHeight * DISMISS_FRACTION || velocity > FLICK_VELOCITY_PX_S

    isDraggingRef.current = false
    setIsDragging(false)

    if (shouldDismiss && dragYRef.current > 0) {
      handleDismiss()
      return
    }

    dragYRef.current = 0
    setDragY(0)
  }, [handleDismiss])

  const onHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      beginDrag(event.clientY)
    },
    [beginDrag],
  )

  const onHandlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return
      moveDrag(event.clientY)
    },
    [moveDrag],
  )

  const onHandlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return
      event.currentTarget.releasePointerCapture(event.pointerId)
      endDrag()
    },
    [endDrag],
  )

  const onContentPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      const scrollTop = scrollRef.current?.scrollTop ?? 0
      if (scrollTop > 0) return
      beginDrag(event.clientY)
    },
    [beginDrag],
  )

  const onContentPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return
      moveDrag(event.clientY)
    },
    [moveDrag],
  )

  const onContentPointerUp = useCallback(() => {
    endDrag()
  }, [endDrag])

  if (!mounted) return null
  if (mobileOnly && !isMobileSheet) return null

  // Handle = affordance de sheet arrastrable; en modal desktop no tiene sentido.
  const shouldShowHandle =
    !isModalDesktop && (showHandle ?? (!header && !bare))
  const resolvedMaxHeight = tall ? '90dvh' : maxHeight

  const isSheetVisible = phase === 'open'
  const panelTransform = isModalDesktop
    ? undefined
    : isDragging
      ? `translateY(${visibleDragY}px)`
      : phase === 'entering' || phase === 'closing'
        ? undefined
        : isSheetVisible
          ? undefined
          : 'translateY(100%)'

  const backdropOpacity = isModalDesktop
    ? phase === 'open'
      ? 1
      : 0
    : phase === 'open'
      ? isDragging
        ? Math.max(0.35, 1 - dragY / (panelRef.current?.offsetHeight ?? 400))
        : 1
      : 0

  const content = (
    <>
      <div
        className={`sheet-backdrop ${isModalDesktop ? 'sheet-backdrop--modal' : ''}`}
        style={{
          opacity: isModalDesktop ? (phase === 'open' ? 1 : 0) : backdropOpacity,
        }}
        onClick={handleDismiss}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={`bottom-sheet ${isModalDesktop ? 'bottom-sheet--modal' : ''} ${
          isDragging ? 'bottom-sheet--dragging' : ''
        } ${phase === 'open' && !isDragging ? 'bottom-sheet--open' : ''} ${
          phase === 'entering' ? 'bottom-sheet--entering' : ''
        } ${phase === 'closing' ? 'bottom-sheet--closing' : ''} ${panelClassName}`}
        style={{
          maxHeight: isModalDesktop ? undefined : resolvedMaxHeight,
          transform: panelTransform,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={title ? titleId : undefined}
      >
        {shouldShowHandle && (
          <div
            className="sheet-handle-area"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
          >
            <div className="sheet-handle" aria-hidden="true" />
          </div>
        )}

        {header}

        {!header && !bare && title && (
          <div className="bottom-sheet-header">
            <p id={titleId} className="bottom-sheet-title">
              {title}
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="bottom-sheet-close"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          className={`bottom-sheet-body ${className}`}
          onPointerDown={
            isModalDesktop || shouldShowHandle ? undefined : onContentPointerDown
          }
          onPointerMove={
            isModalDesktop || shouldShowHandle ? undefined : onContentPointerMove
          }
          onPointerUp={
            isModalDesktop || shouldShowHandle ? undefined : onContentPointerUp
          }
          onPointerCancel={
            isModalDesktop || shouldShowHandle ? undefined : onContentPointerUp
          }
        >
          {children}
        </div>
      </div>
    </>
  )

  return createPortal(content, document.body)
}
