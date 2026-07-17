import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
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

function useDayIndicator(
  containerRef: RefObject<HTMLElement | null>,
  itemRefs: MutableRefObject<Map<number, HTMLElement>>,
  activeDay: number,
  previewDay: number | null,
) {
  const [indicator, setIndicator] = useState<{
    left: number
    width: number
    height: number
  } | null>(null)

  const updateIndicator = useCallback(() => {
    const container = containerRef.current
    const targetDay = previewDay ?? activeDay
    const target = itemRefs.current.get(targetDay)
    if (!container || !target) {
      setIndicator(null)
      return
    }

    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    setIndicator({
      left: targetRect.left - containerRect.left,
      width: targetRect.width,
      height: targetRect.height,
    })
  }, [activeDay, containerRef, itemRefs, previewDay])

  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(updateIndicator)
    observer.observe(container)
    window.addEventListener('resize', updateIndicator)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [containerRef, updateIndicator])

  return indicator
}

interface MobileDaySelectorProps {
  days: ReadonlyArray<{ value: number; label: string }>
  activeDay: number
  onDayChange: (day: number) => void
  hasMeetingsForDay: (day: number) => boolean
}

export function MobileDaySelector({
  days,
  activeDay,
  onDayChange,
  hasMeetingsForDay,
}: MobileDaySelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const isScrubbingRef = useRef(false)
  const suppressClickRef = useRef(false)
  const [scrubDay, setScrubDay] = useState<number | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)

  const previewDay = scrubDay
  const indicator = useDayIndicator(containerRef, itemRefs, activeDay, previewDay)

  const setItemRef = useCallback((day: number) => {
    return (element: HTMLElement | null) => {
      if (element) itemRefs.current.set(day, element)
      else itemRefs.current.delete(day)
    }
  }, [])

  const resolveDayAtPoint = useCallback((x: number, y: number) => {
    return findDayAtPoint(x, y, itemRefs.current)
  }, [])

  const handleScrubStart = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, day: number) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      dragStartRef.current = { x: event.clientX, y: event.clientY }
      isScrubbingRef.current = false
      setIsScrubbing(false)
      setScrubDay(day)
    },
    [],
  )

  const handleScrubMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStartRef.current || event.buttons === 0) return

    const deltaX = event.clientX - dragStartRef.current.x
    const deltaY = event.clientY - dragStartRef.current.y
    if (!isScrubbingRef.current && Math.hypot(deltaX, deltaY) > SCRUB_DRAG_THRESHOLD_PX) {
      isScrubbingRef.current = true
      setIsScrubbing(true)
    }

    const day = resolveDayAtPoint(event.clientX, event.clientY)
    if (day !== null) setScrubDay(day)
  }, [resolveDayAtPoint])

  const handleScrubEnd = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const day = resolveDayAtPoint(event.clientX, event.clientY) ?? scrubDay
      const wasScrubbing = isScrubbingRef.current

      dragStartRef.current = null
      isScrubbingRef.current = false
      setIsScrubbing(false)
      setScrubDay(null)

      if (wasScrubbing && day !== null && day !== activeDay) {
        suppressClickRef.current = true
        onDayChange(day)
      }
    },
    [activeDay, onDayChange, resolveDayAtPoint, scrubDay],
  )

  const handleClick = useCallback(
    (day: number) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        return
      }
      onDayChange(day)
    },
    [onDayChange],
  )

  return (
    <div className="mobile-days sticky top-0 z-20" data-tour="day-selector">
      <div
        ref={containerRef}
        className={`mobile-days-grid relative ${isScrubbing ? 'mobile-days-grid--scrubbing' : ''}`}
      >
        {indicator && (
          <div
            className="mobile-days-indicator"
            style={{
              left: indicator.left,
              width: indicator.width,
              height: indicator.height,
            }}
            aria-hidden="true"
          />
        )}

        {days.map((day) => {
          const hasMeetings = hasMeetingsForDay(day.value)
          const isActive = (previewDay ?? activeDay) === day.value

          return (
            <button
              key={day.value}
              ref={setItemRef(day.value)}
              type="button"
              onClick={() => handleClick(day.value)}
              onPointerDown={(event) => handleScrubStart(event, day.value)}
              onPointerMove={handleScrubMove}
              onPointerUp={handleScrubEnd}
              onPointerCancel={handleScrubEnd}
              className={`mobile-day-btn ${isActive ? 'mobile-day-btn--active' : ''}`}
              aria-pressed={activeDay === day.value}
            >
              <span className="leading-none">{day.label.slice(0, 3)}</span>
              <span
                className="mt-1 flex h-1.5 w-full items-center justify-center"
                aria-hidden={!hasMeetings}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hasMeetings
                      ? isActive
                        ? 'bg-white/70'
                        : 'bg-slate-400/70'
                      : 'opacity-0'
                  }`}
                />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
