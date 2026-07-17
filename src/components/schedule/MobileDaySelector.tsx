import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

const SCRUB_DRAG_THRESHOLD_PX = 6

function findDayAtPoint(
  x: number,
  y: number,
  itemRefs: Map<number, HTMLElement>,
): number | null {
  for (const [day, element] of itemRefs) {
    const rect = element.getBoundingClientRect()
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return day
    }
  }

  let nearestDay: number | null = null
  let nearestDistance = Infinity

  for (const [day, element] of itemRefs) {
    const rect = element.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const distance = Math.abs(x - centerX)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestDay = day
    }
  }

  return nearestDay
}

interface MobileDaySelectorProps {
  days: ReadonlyArray<{ value: number; label: string }>
  activeDay: number
  onDayChange: (day: number) => void
}

export function MobileDaySelector({
  days,
  activeDay,
  onDayChange,
}: MobileDaySelectorProps) {
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())
  const dragStartRef = useRef<{ x: number; y: number; day: number } | null>(null)
  const isScrubbingRef = useRef(false)
  const suppressClickRef = useRef(false)
  const activeDayRef = useRef(activeDay)
  const [scrubDay, setScrubDay] = useState<number | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)

  useEffect(() => {
    activeDayRef.current = activeDay
  }, [activeDay])

  const focusedDay = scrubDay ?? activeDay

  useEffect(() => {
    const element = itemRefs.current.get(focusedDay)
    element?.scrollIntoView({
      behavior: isScrubbing ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [focusedDay, isScrubbing])

  const setItemRef = useCallback((day: number) => {
    return (element: HTMLElement | null) => {
      if (element) itemRefs.current.set(day, element)
      else itemRefs.current.delete(day)
    }
  }, [])

  const resolveDayAtPoint = useCallback((x: number, y: number) => {
    return findDayAtPoint(x, y, itemRefs.current)
  }, [])

  const commitDay = useCallback(
    (day: number) => {
      if (day === activeDayRef.current) return
      suppressClickRef.current = true
      onDayChange(day)
    },
    [onDayChange],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return

      const day = resolveDayAtPoint(event.clientX, event.clientY) ?? activeDayRef.current
      event.currentTarget.setPointerCapture(event.pointerId)
      dragStartRef.current = { x: event.clientX, y: event.clientY, day }
      isScrubbingRef.current = false
      setIsScrubbing(false)
      setScrubDay(day)
    },
    [resolveDayAtPoint],
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStartRef.current || event.buttons === 0) return

      const deltaX = event.clientX - dragStartRef.current.x
      if (!isScrubbingRef.current && Math.abs(deltaX) > SCRUB_DRAG_THRESHOLD_PX) {
        isScrubbingRef.current = true
        setIsScrubbing(true)
      }

      const day = resolveDayAtPoint(event.clientX, event.clientY)
      if (day === null) return

      setScrubDay(day)

      if (isScrubbingRef.current && day !== activeDayRef.current) {
        commitDay(day)
      }
    },
    [commitDay, resolveDayAtPoint],
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const start = dragStartRef.current
      const day = resolveDayAtPoint(event.clientX, event.clientY) ?? start?.day ?? null
      const wasScrubbing = isScrubbingRef.current

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      dragStartRef.current = null
      isScrubbingRef.current = false
      setIsScrubbing(false)
      setScrubDay(null)

      if (!wasScrubbing && day !== null) {
        commitDay(day)
      }
    },
    [commitDay, resolveDayAtPoint],
  )

  const handleClick = useCallback(
    (day: number) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        return
      }
      commitDay(day)
    },
    [commitDay],
  )

  return (
    <div className="mobile-days shrink-0 z-20" data-tour="day-selector">
      <div
        className={`mobile-days-scroll touch-none select-none ${
          isScrubbing ? 'mobile-days-scroll--scrubbing' : ''
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {days.map((day) => {
          const isActive = focusedDay === day.value

          return (
            <button
              key={day.value}
              ref={setItemRef(day.value)}
              type="button"
              onClick={() => handleClick(day.value)}
              className={`mobile-day-label ${isActive ? 'mobile-day-label--active' : ''}`}
              aria-pressed={activeDay === day.value}
            >
              <span className="mobile-day-label-text">{day.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
