/** Convierte "HH:MM" o "HH:MM:SS" a minutos desde medianoche. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

/** Convierte minutos a "HH:MM". */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`
}

export function doTimesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const startMinutesA = timeToMinutes(startA)
  const endMinutesA = timeToMinutes(endA)
  const startMinutesB = timeToMinutes(startB)
  const endMinutesB = timeToMinutes(endB)
  return startMinutesA < endMinutesB && startMinutesB < endMinutesA
}

export type OverlapKind = 'exact' | 'partial' | 'contained' | 'duplicate'

export function classifyOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
  sameSection: boolean,
): OverlapKind {
  if (sameSection) {
    return 'duplicate'
  }

  const startMinutesA = timeToMinutes(startA)
  const endMinutesA = timeToMinutes(endA)
  const startMinutesB = timeToMinutes(startB)
  const endMinutesB = timeToMinutes(endB)

  if (
    startMinutesA === startMinutesB &&
    endMinutesA === endMinutesB
  ) {
    return 'exact'
  }

  const aContainsB =
    startMinutesA <= startMinutesB && endMinutesA >= endMinutesB
  const bContainsA =
    startMinutesB <= startMinutesA && endMinutesB >= endMinutesA

  if (aContainsB || bContainsA) {
    return 'contained'
  }

  return 'partial'
}

export function getOverlapRange(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): { overlapStart: string; overlapEnd: string } {
  const overlapStartMinutes = Math.max(
    timeToMinutes(startA),
    timeToMinutes(startB),
  )
  const overlapEndMinutes = Math.min(timeToMinutes(endA), timeToMinutes(endB))
  return {
    overlapStart: minutesToTime(overlapStartMinutes),
    overlapEnd: minutesToTime(overlapEndMinutes),
  }
}
