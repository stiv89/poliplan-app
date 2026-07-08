import { useEffect, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface AnimatedPopoverProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  popoverRef?: RefObject<HTMLDivElement | null>
  align?: 'left' | 'right'
  className?: string
  children: ReactNode
  offset?: number
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
}: AnimatedPopoverProps) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0 })

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return

    function updatePosition() {
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      setPosition({
        top: rect.bottom + offset,
        left: rect.left,
        right: window.innerWidth - rect.right,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, anchorRef, offset])

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

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      style={{
        position: 'fixed',
        top: position.top,
        ...(align === 'right' ? { right: position.right } : { left: position.left }),
        zIndex: 200,
      }}
      className={`origin-top transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[opacity,transform] ${
        visible
          ? 'translate-y-0 scale-100 opacity-100'
          : '-translate-y-1.5 scale-[0.96] opacity-0'
      } ${className}`}
    >
      {children}
    </div>,
    document.body,
  )
}
