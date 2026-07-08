import { SCHEDULE_FILTER_CONFIG } from '@/config/scheduleFilters'

export interface ScheduleViewFilters {
  days: number[]
  timeStartMinutes: number
  timeEndMinutes: number
}

export const DEFAULT_SCHEDULE_VIEW_FILTERS: ScheduleViewFilters = {
  days: [...SCHEDULE_FILTER_CONFIG.availableDays],
  timeStartMinutes: SCHEDULE_FILTER_CONFIG.timeRange.minMinutes,
  timeEndMinutes: SCHEDULE_FILTER_CONFIG.timeRange.maxMinutes,
}
