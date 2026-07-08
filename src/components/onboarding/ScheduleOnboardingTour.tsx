import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { ArrowRight, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  DESKTOP_TOUR_STEPS,
  MOBILE_TOUR_STEPS,
} from '@/components/onboarding/tourSteps'
import { openCareerMenu } from '@/utils/openCareerMenu'

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

interface ScheduleOnboardingTourProps {
  open: boolean
  onComplete: () => void
  onDismiss: () => void
}

const SPOTLIGHT_PADDING = 10

function useIsMobileLayout() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return mobile
}

function getTargetRect(selector?: string): TargetRect | null {
  if (!selector) return null
  const elements = document.querySelectorAll(selector)
  for (const element of elements) {
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }
    }
  }
  return null
}

export function ScheduleOnboardingTour({ open, onComplete, onDismiss }: ScheduleOnboardingTourProps) {
  const isMobile = useIsMobileLayout()
  const steps = useMemo(() => (isMobile ? MOBILE_TOUR_STEPS : DESKTOP_TOUR_STEPS), [isMobile])
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const isWelcome = !step?.target

  const refreshTarget = useCallback(() => {
    setTargetRect(getTargetRect(step?.target))
  }, [step?.target])

  useLayoutEffect(() => {
    if (!open) return
    refreshTarget()
  }, [open, stepIndex, step?.target, refreshTarget, isMobile])

  useEffect(() => {
    if (!open) return

    function onLayoutChange() {
      refreshTarget()
    }

    window.addEventListener('resize', onLayoutChange)
    window.addEventListener('scroll', onLayoutChange, true)
    return () => {
      window.removeEventListener('resize', onLayoutChange)
      window.removeEventListener('scroll', onLayoutChange, true)
    }
  }, [open, refreshTarget])

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setTargetRect(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !step) return
    step.onEnter?.()
  }, [open, step, stepIndex])

  if (!open || !step) return null

  function handleNext() {
    if (!step) return

    if (isLast) {
      onComplete()
      return
    }

    setStepIndex((value) => value + 1)
  }

  function handleOpenCareer() {
    openCareerMenu()
  }

  const spotlightStyle = targetRect
    ? {
        top: targetRect.top - SPOTLIGHT_PADDING,
        left: targetRect.left - SPOTLIGHT_PADDING,
        width: targetRect.width + SPOTLIGHT_PADDING * 2,
        height: targetRect.height + SPOTLIGHT_PADDING * 2,
      }
    : null

  const cardPosition = computeCardPosition(targetRect, isMobile, isWelcome)

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="schedule-tour-title">
      {spotlightStyle ? (
        <div
          className="pointer-events-none fixed z-[71] rounded-2xl transition-all duration-300 ease-out"
          style={{
            ...spotlightStyle,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.62)',
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]" aria-hidden="true" />
      )}

      <div
        className="fixed z-[72] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all duration-300"
        style={cardPosition}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Paso {stepIndex + 1} de {steps.length}
              </p>
              <h2 id="schedule-tour-title" className="text-sm font-semibold text-text">
                {step.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1.5 text-muted hover:bg-slate-100"
            aria-label="Cerrar tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <p className="text-sm leading-relaxed text-muted">{step.description}</p>
          {step.hint && (
            <p className="rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-primary">{step.hint}</p>
          )}
          <div aria-hidden="true">{step.visual}</div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <div className="flex gap-1.5">
            {steps.map((item, index) => (
              <span
                key={item.id}
                className={`h-1.5 rounded-full transition-all ${
                  index === stepIndex ? 'w-5 bg-primary' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step.id === 'career' && (
              <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={handleOpenCareer}>
                Abrir listado
              </Button>
            )}
            <Button onClick={handleNext} className="gap-1.5 px-3 py-1.5 text-xs">
              {isLast ? 'Empezar' : 'Siguiente'}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
            </Button>
          </div>
        </div>

        <div className="px-4 pb-3 text-center">
          <button type="button" onClick={onDismiss} className="text-xs text-muted hover:text-text hover:underline">
            Saltar tour
          </button>
        </div>
      </div>
    </div>
  )
}

function computeCardPosition(
  targetRect: TargetRect | null,
  isMobile: boolean,
  centered: boolean,
): { top: number | string; left: number | string; transform?: string } {
  if (centered || !targetRect) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  const cardWidth = Math.min(352, window.innerWidth - 32)
  const cardHeightEstimate = 360
  const gap = 16
  const viewportPadding = 16

  let top = targetRect.top + targetRect.height + gap
  let left = targetRect.left

  if (isMobile) {
    left = (window.innerWidth - cardWidth) / 2
    if (top + cardHeightEstimate > window.innerHeight - viewportPadding) {
      top = Math.max(viewportPadding, targetRect.top - cardHeightEstimate - gap)
    }
    return { top, left }
  }

  if (left + cardWidth > window.innerWidth - viewportPadding) {
    left = window.innerWidth - cardWidth - viewportPadding
  }
  left = Math.max(viewportPadding, left)

  if (top + cardHeightEstimate > window.innerHeight - viewportPadding) {
    top = Math.max(viewportPadding, targetRect.top - cardHeightEstimate - gap)
  }

  return { top, left }
}
