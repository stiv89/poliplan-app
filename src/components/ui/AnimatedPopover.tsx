import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface AnimatedPopoverProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  popoverRef?: RefObject<HTMLDivElement | null>
  align?: 'left' | 'right'
  className?: string
  children: ReactNode
  offset?: number
  /** anchor = junto al bloque; viewport = centrado y contenido en pantalla */
  strategy?: 'anchor' | 'viewport'
  viewportPadding?: number
}

function clampViewportPosition(
  popoverRect: DOMRect,
  padding: number,
): { top: number; left: number } {
  const maxTop = Math.max(padding, window.innerHeight - popoverRect.height - padding)
  const maxLeft = Math.max(padding, window.innerWidth - popoverRect.width - padding)

  const top = Math.min(Math.max(padding, (window.innerHeight - popoverRect.height) / 2), maxTop)
  const left = Math.min(Math.max(padding, (window.innerWidth - popoverRect.width) / 2), maxLeft)

  return { top, left }
}

function clampAnchorPosition(
  anchorRect: DOMRect,
  popoverRect: DOMRect,
  align: 'left' | 'right',
  offset: number,
  padding: number,
): { top: number; left: number; right: number; placement: 'above' | 'below' } {
  const spaceBelow = window.innerHeight - anchorRect.bottom - padding
  const spaceAbove = anchorRect.top - padding
  const placeAbove =
    popoverRect.height + offset > spaceBelow && spaceAbove > spaceBelow

  const top = placeAbove
    ? Math.max(padding, anchorRect.top - popoverRect.height - offset)
    : anchorRect.bottom + offset

  let left = align === 'right' ? undefined : anchorRect.left
  let right = align === 'right' ? window.innerWidth - anchorRect.right : undefined

  if (align === 'left' && left != null) {
    left = Math.min(Math.max(padding, left), window.innerWidth - popoverRect.width - padding)
  }
  if (align === 'right' && right != null) {
    const computedLeft = window.innerWidth - right - popoverRect.width
    const clampedLeft = Math.min(
      Math.max(padding, computedLeft),
      window.innerWidth - popoverRect.width - padding,
    )
    left = clampedLeft
    right = undefined
  }

  return {
    top,
    left: left ?? padding,
    right: right ?? padding,
    placement: placeAbove ? 'above' : 'below',
  }
}

/** Popover flotante (portal + fixed) con animación suave estilo iOS. */
export function AnimatedPopover({
  open,
  anchorRef,
  popoverRef,
  align = 'left',
  className = '',
  children,
  offset = 8,
  strategy = 'anchor',
  viewportPadding = 12,
}: AnimatedPopoverProps) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0 })
  const [anchorPlacement, setAnchorPlacement] = useState<'above' | 'below'>('below')
  const internalPopoverRef = useRef<HTMLDivElement>(null)
  const resolvedPopoverRef = popoverRef ?? internalPopoverRef

  useLayoutEffect(() => {
    if (!open || !visible) return

    function updatePosition() {
      const popover = resolvedPopoverRef.current
      if (!popover) return

      const popoverRect = popover.getBoundingClientRect()
      if (popoverRect.width === 0 && popoverRect.height === 0) return

      if (strategy === 'viewport') {
        const next = clampViewportPosition(popoverRect, viewportPadding)
        setPosition({ top: next.top, left: next.left, right: 0 })
        return
      }

      const anchor = anchorRef.current
      if (!anchor) return

      const next = clampAnchorPosition(
        anchor.getBoundingClientRect(),
        popoverRect,
        align,
        offset,
        viewportPadding,
      )
      setPosition({ top: next.top, left: next.left, right: next.right })
      setAnchorPlacement(next.placement)
    }

    updatePosition()
    const frame = requestAnimationFrame(updatePosition)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updatePosition)
        : null
    if (observer && resolvedPopoverRef.current) {
      observer.observe(resolvedPopoverRef.current)
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      observer?.disconnect()
    }
  }, [open, visible, anchorRef, align, offset, strategy, viewportPadding, resolvedPopoverRef])

  useEffect(() => {
    if (open) {
      setMounted(true)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      return () => cancelAnimationFrame(frame)
    }

    setVisible(false)
    const timeout = window.setTimeout(() => setMounted(false), 220)
    return () => window.clearTimeout(timeout)
  }, [open])

  if (!mounted) return null

  const transformOrigin =
    strategy === 'viewport'
      ? 'center center'
      : anchorPlacement === 'above'
        ? 'bottom left'
        : 'top left'

  return createPortal(
    <div
      ref={resolvedPopoverRef}
      role="dialog"
      aria-modal="false"
      style={{
        position: 'fixed',
        top: position.top,
        ...(strategy === 'viewport' || align === 'left'
          ? { left: position.left }
          : { right: position.right }),
        zIndex: 200,
        maxHeight:
          strategy === 'viewport'
            ? `calc(100dvh - ${viewportPadding * 2}px)`
            : undefined,
        overflowY: strategy === 'viewport' ? 'auto' : undefined,
        transformOrigin,
      }}
      className={`transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[opacity,transform] ${
        visible
          ? 'translate-y-0 scale-100 opacity-100'
          : strategy === 'viewport'
            ? 'scale-[0.96] opacity-0'
            : '-translate-y-1.5 scale-[0.96] opacity-0'
      } ${className}`}
    >
      {children}
    </div>,
    document.body,
  )
}
