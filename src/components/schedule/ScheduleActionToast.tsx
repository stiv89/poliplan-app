import { useEffect } from 'react'
import { Check, Minus } from 'lucide-react'

export type ScheduleActionFeedback = {
  kind: 'added' | 'removed'
  label: string
}

interface ScheduleActionToastProps {
  feedback: ScheduleActionFeedback | null
  onDismiss: () => void
  /** Auto-hide after ms. Default 1800. */
  durationMs?: number
}

export function ScheduleActionToast({
  feedback,
  onDismiss,
  durationMs = 1800,
}: ScheduleActionToastProps) {
  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(timer)
  }, [feedback, durationMs, onDismiss])

  if (!feedback) return null

  const isAdded = feedback.kind === 'added'

  return (
    <div
      className="schedule-action-toast bottom-above-dock pointer-events-none fixed inset-x-0 z-[110] flex justify-center px-4 md:bottom-8"
      role="status"
      aria-live="polite"
    >
      <div
        className={`schedule-action-toast-pill flex max-w-[min(100%,22rem)] items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-medium shadow-lg ${
          isAdded
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-800 text-white'
        }`}
      >
        {isAdded ? (
          <Check className="check-pop h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <Minus className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        )}
        <span className="truncate">{feedback.label}</span>
      </div>
    </div>
  )
}
