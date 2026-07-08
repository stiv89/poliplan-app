import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react'
import type { ClassBlockInfo } from '@/components/schedule/ClassBlockDetail'

function useSupportsHover() {
  const [supports, setSupports] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const onChange = () => setSupports(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return supports
}

export function useClassBlockPopover() {
  const [activeBlock, setActiveBlock] = useState<ClassBlockInfo | null>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const supportsHover = useSupportsHover()

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current != null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const close = useCallback(() => {
    clearCloseTimeout()
    setActiveBlock(null)
  }, [])

  const openBlock = (block: ClassBlockInfo, anchor: HTMLButtonElement) => {
    clearCloseTimeout()
    anchorRef.current = anchor
    setActiveBlock(block)
  }

  const scheduleClose = () => {
    clearCloseTimeout()
    closeTimeoutRef.current = window.setTimeout(() => {
      setActiveBlock(null)
    }, 140)
  }

  const handleBlockClick = (block: ClassBlockInfo, event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (activeBlock?.id === block.id) {
      close()
      return
    }
    openBlock(block, event.currentTarget)
  }

  const handleBlockMouseEnter = (
    block: ClassBlockInfo,
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    if (!supportsHover) return
    openBlock(block, event.currentTarget)
  }

  const handleBlockMouseLeave = () => {
    if (!supportsHover) return
    scheduleClose()
  }

  const handlePopoverMouseEnter = () => clearCloseTimeout()

  const handlePopoverMouseLeave = () => {
    if (supportsHover) scheduleClose()
  }

  useEffect(() => {
    if (!activeBlock) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      close()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [activeBlock, close])

  return {
    activeBlock,
    anchorRef: anchorRef as RefObject<HTMLElement | null>,
    popoverRef,
    handleBlockClick,
    handleBlockMouseEnter,
    handleBlockMouseLeave,
    handlePopoverMouseEnter,
    handlePopoverMouseLeave,
    close,
  }
}
