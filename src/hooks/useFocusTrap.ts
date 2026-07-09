import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Traps focus inside `containerRef` while `active` is true. Restores focus on cleanup. */
export function useFocusTrap(
  active: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  onEscape?: () => void,
  returnFocusRef?: React.RefObject<HTMLElement | null>,
) {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  useEffect(() => {
    if (!active) return

    previousFocusRef.current =
      returnFocusRef?.current ?? (document.activeElement as HTMLElement | null)

    const container = containerRef.current
    if (!container) return

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null,
      )

    const initial = focusables()
    const preferred =
      container.querySelector<HTMLElement>('[data-autofocus]') ?? initial[0] ?? null
    preferred?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscapeRef.current?.()
        return
      }

      if (event.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]!
      const last = items[items.length - 1]!
      const activeEl = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (activeEl === first || !container?.contains(activeEl)) {
          event.preventDefault()
          last.focus()
        }
      } else if (activeEl === last || !container?.contains(activeEl)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const restore = returnFocusRef?.current ?? previousFocusRef.current
      restore?.focus?.()
    }
  }, [active, containerRef, returnFocusRef])
}
