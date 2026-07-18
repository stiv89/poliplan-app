interface ScheduleConflictNoteProps {
  message: string
  className?: string
}

/** Discreet per-row schedule overlap hint. */
export function ScheduleConflictNote({ message, className = '' }: ScheduleConflictNoteProps) {
  return (
    <p className={`section-conflict-note ${className}`.trim()} role="note">
      <span aria-hidden="true">⚠ </span>
      {message}
    </p>
  )
}

interface ScheduleConflictBannerProps {
  courseCount: number
  onViewDetail?: () => void
}

/** Summary banner shown above conflicting course groups. */
export function ScheduleConflictBanner({ courseCount, onViewDetail }: ScheduleConflictBannerProps) {
  const label =
    courseCount === 2
      ? '2 materias tienen un conflicto horario'
      : `${courseCount} materias tienen un conflicto horario`

  return (
    <div className="schedule-conflict-banner" role="status">
      <span className="schedule-conflict-banner-text">
        <span aria-hidden="true">⚠️ </span>
        {label}
      </span>
      {onViewDetail && (
        <>
          <span className="schedule-conflict-banner-sep" aria-hidden="true">
            ·
          </span>
          <button type="button" className="schedule-conflict-banner-action" onClick={onViewDetail}>
            Ver detalle
          </button>
        </>
      )}
    </div>
  )
}
