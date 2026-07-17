import { useEffect, useRef, useState } from 'react'

const SWIPE_THRESHOLD_PX = 48
const DIRECTION_LOCK_PX = 10

export function useHorizontalDaySwipe({
  onPrevious,
  onNext,
  enabled = true,
}: {
  onPrevious: () => void
  onNext: () => void
  enabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<{
    start: { x: number; y: number } | null
    locked: 'horizontal' | 'vertical' | null
  }>({ start: null, locked: null })
  const [offsetX, setOffsetX] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) return

    function resetGesture() {
      gestureRef.current = { start: null, locked: null }
      setOffsetX(0)
      setIsAnimating(true)
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      if (!touch) return
      gestureRef.current = {
        start: { x: touch.clientX, y: touch.clientY },
        locked: null,
      }
      setIsAnimating(false)
    }

    function onTouchMove(event: TouchEvent) {
      const start = gestureRef.current.start
      if (!start || event.touches.length !== 1) return

      const touch = event.touches[0]
      if (!touch) return
      const deltaX = touch.clientX - start.x
      const deltaY = touch.clientY - start.y

      if (!gestureRef.current.locked) {
        if (Math.abs(deltaX) > DIRECTION_LOCK_PX || Math.abs(deltaY) > DIRECTION_LOCK_PX) {
          gestureRef.current.locked =
            Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
        }
      }

      if (gestureRef.current.locked === 'horizontal') {
        event.preventDefault()
        setOffsetX(deltaX * 0.38)
      }
    }

    function onTouchEnd(event: TouchEvent) {
      const start = gestureRef.current.start
      if (!start) {
        resetGesture()
        return
      }

      const touch = event.changedTouches[0]
      if (!touch) {
        resetGesture()
        return
      }

      const deltaX = touch.clientX - start.x
      if (gestureRef.current.locked === 'horizontal') {
        if (deltaX <= -SWIPE_THRESHOLD_PX) onNext()
        else if (deltaX >= SWIPE_THRESHOLD_PX) onPrevious()
      }

      resetGesture()
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd, { passive: true })
    element.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', onTouchStart)
      element.removeEventListener('touchmove', onTouchMove)
      element.removeEventListener('touchend', onTouchEnd)
      element.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [enabled, onNext, onPrevious])

  return {
    ref,
    offsetX,
    isAnimating,
  }
}
