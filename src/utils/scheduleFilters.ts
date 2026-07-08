import { SCHEDULE_FILTER_CONFIG } from '@/config/scheduleFilters'
import type { AcademicPeriod, CourseSection } from '@/types/academic'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import { DEFAULT_SCHEDULE_VIEW_FILTERS } from '@/types/scheduleFilters'
import { timeToMinutes } from '@/utils/times'

export function formatAcademicPeriodLabel(period: AcademicPeriod): string {
  if (SCHEDULE_FILTER_CONFIG.preferOfficialPeriodNames && period.name.trim()) {
    return period.name
  }

  const termLabel =
    SCHEDULE_FILTER_CONFIG.termLabels[period.term] ?? `Período ${period.term}`
  return `${termLabel} ${period.year}`
}

export function sortAcademicPeriods(periods: AcademicPeriod[]): AcademicPeriod[] {
  return [...periods].sort((a, b) => b.year - a.year || b.term - a.term)
}

export function getAdjacentPeriodId(
  periods: AcademicPeriod[],
  currentId: string | null,
  direction: -1 | 1,
): string | null {
  const sorted = sortAcademicPeriods(periods)
  if (sorted.length === 0) return null

  const index = currentId
    ? sorted.findIndex((period) => period.id === currentId)
    : sorted.findIndex((period) => period.isActive)

  const baseIndex = index >= 0 ? index : 0
  const nextIndex = baseIndex + direction
  if (nextIndex < 0 || nextIndex >= sorted.length) return null
  return sorted[nextIndex]!.id
}

export function formatFilterTimeLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const suffix = hours >= 12 ? 'pm' : 'am'
  const hour12 = hours % 12 || 12
  if (mins === 0) return `${hour12}${suffix}`
  return `${hour12}:${String(mins).padStart(2, '0')}${suffix}`
}

export function isScheduleViewFiltersActive(
  filters: ScheduleViewFilters,
  defaults: ScheduleViewFilters = DEFAULT_SCHEDULE_VIEW_FILTERS,
): boolean {
  const defaultDays = [...defaults.days].sort((a, b) => a - b).join(',')
  const currentDays = [...filters.days].sort((a, b) => a - b).join(',')
  return (
    defaultDays !== currentDays ||
    filters.timeStartMinutes !== defaults.timeStartMinutes ||
    filters.timeEndMinutes !== defaults.timeEndMinutes
  )
}

export function sectionMatchesViewFilters(
  section: CourseSection,
  filters: ScheduleViewFilters,
): boolean {
  if (filters.days.length === 0) return false

  return section.meetings.some((meeting) => {
    if (!filters.days.includes(meeting.dayOfWeek)) return false
    const start = timeToMinutes(meeting.startTime)
    const end = timeToMinutes(meeting.endTime)
    return end > filters.timeStartMinutes && start < filters.timeEndMinutes
  })
}

export function meetingMatchesViewFilters(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  filters: ScheduleViewFilters,
): boolean {
  if (!filters.days.includes(dayOfWeek)) return false
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime)
  return end > filters.timeStartMinutes && start < filters.timeEndMinutes
}
