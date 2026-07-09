import { SCHEDULE_FILTER_CONFIG } from '@/config/scheduleFilters'
import { DAYS_OF_WEEK } from '@/config/constants'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'
import { DEFAULT_SCHEDULE_VIEW_FILTERS } from '@/types/scheduleFilters'
import {
  formatFilterTimeLabel,
  isScheduleViewFiltersActive,
} from '@/utils/scheduleFilters'

export interface SectionExplorerFilterState {
  semesterFilter: number | null
  shiftFilter: string | null
  viewFilters: ScheduleViewFilters
}

export interface ActiveExplorerFilterChip {
  id: string
  label: string
  onRemove: () => void
}

export function countAdvancedExplorerFilters(
  viewFilters: ScheduleViewFilters,
  defaults: ScheduleViewFilters = DEFAULT_SCHEDULE_VIEW_FILTERS,
): number {
  let count = 0
  const defaultDays = [...defaults.days].sort((a, b) => a - b).join(',')
  const currentDays = [...viewFilters.days].sort((a, b) => a - b).join(',')
  if (defaultDays !== currentDays) count++
  if (
    viewFilters.timeStartMinutes !== defaults.timeStartMinutes ||
    viewFilters.timeEndMinutes !== defaults.timeEndMinutes
  ) {
    count++
  }
  return count
}

export function countSectionExplorerFilters(
  state: SectionExplorerFilterState,
  defaults: ScheduleViewFilters = DEFAULT_SCHEDULE_VIEW_FILTERS,
): number {
  let count = 0
  if (state.semesterFilter != null) count++
  if (state.shiftFilter != null) count++
  if (isScheduleViewFiltersActive(state.viewFilters, defaults)) {
    const defaultDays = [...defaults.days].sort((a, b) => a - b).join(',')
    const currentDays = [...state.viewFilters.days].sort((a, b) => a - b).join(',')
    if (defaultDays !== currentDays) count++
    if (
      state.viewFilters.timeStartMinutes !== defaults.timeStartMinutes ||
      state.viewFilters.timeEndMinutes !== defaults.timeEndMinutes
    ) {
      count++
    }
  }
  return count
}

export function buildActiveExplorerFilterChips(input: {
  semesterFilter: number | null
  shiftFilter: string | null
  viewFilters: ScheduleViewFilters
  onSemesterChange: (value: number | null) => void
  onShiftChange: (value: string | null) => void
  onViewFiltersChange: (filters: ScheduleViewFilters) => void
  defaults?: ScheduleViewFilters
}): ActiveExplorerFilterChip[] {
  const defaults = input.defaults ?? DEFAULT_SCHEDULE_VIEW_FILTERS
  const chips: ActiveExplorerFilterChip[] = []

  if (input.semesterFilter != null) {
    chips.push({
      id: 'semester',
      label: `${input.semesterFilter}.º semestre`,
      onRemove: () => input.onSemesterChange(null),
    })
  }

  if (input.shiftFilter != null) {
    chips.push({
      id: 'shift',
      label: `Turno: ${input.shiftFilter}`,
      onRemove: () => input.onShiftChange(null),
    })
  }

  const defaultDays = [...defaults.days].sort((a, b) => a - b).join(',')
  const currentDays = [...input.viewFilters.days].sort((a, b) => a - b).join(',')
  if (defaultDays !== currentDays) {
    for (const day of input.viewFilters.days) {
      const dayMeta = DAYS_OF_WEEK.find((item) => item.value === day)
      chips.push({
        id: `day-${day}`,
        label: dayMeta?.label ?? `Día ${day}`,
        onRemove: () => {
          const nextDays = input.viewFilters.days.filter((value) => value !== day)
          input.onViewFiltersChange({ ...input.viewFilters, days: nextDays })
        },
      })
    }
  }

  if (
    input.viewFilters.timeStartMinutes !== defaults.timeStartMinutes ||
    input.viewFilters.timeEndMinutes !== defaults.timeEndMinutes
  ) {
    chips.push({
      id: 'time',
      label: `Horario: ${formatFilterTimeLabel(input.viewFilters.timeStartMinutes)}–${formatFilterTimeLabel(input.viewFilters.timeEndMinutes)}`,
      onRemove: () =>
        input.onViewFiltersChange({
          ...input.viewFilters,
          timeStartMinutes: defaults.timeStartMinutes,
          timeEndMinutes: defaults.timeEndMinutes,
        }),
    })
  }

  return chips
}

export function clearSectionExplorerFilters(
  onSemesterChange: (value: number | null) => void,
  onShiftChange: (value: string | null) => void,
  onViewFiltersChange: (filters: ScheduleViewFilters) => void,
): void {
  onSemesterChange(null)
  onShiftChange(null)
  onViewFiltersChange({ ...DEFAULT_SCHEDULE_VIEW_FILTERS })
}

export function semesterOptions(max = 10): number[] {
  return Array.from({ length: max }, (_, index) => index + 1)
}

export const EXPLORER_SHIFT_OPTIONS = ['Mañana', 'Tarde', 'Noche'] as const

export { SCHEDULE_FILTER_CONFIG }
