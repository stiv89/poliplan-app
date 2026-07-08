import { describe, expect, it } from 'vitest'
import type { AcademicPeriod, CourseSection } from '@/types/academic'
import { DEFAULT_SCHEDULE_VIEW_FILTERS } from '@/types/scheduleFilters'
import {
  formatAcademicPeriodLabel,
  getAdjacentPeriodId,
  isScheduleViewFiltersActive,
  sectionMatchesViewFilters,
  sortAcademicPeriods,
} from '@/utils/scheduleFilters'

const periods: AcademicPeriod[] = [
  {
    id: 'p1',
    name: 'Primer Periodo 2026',
    year: 2026,
    term: 1,
    startsAt: null,
    endsAt: null,
    isActive: true,
  },
  {
    id: 'p2',
    name: 'Segundo Periodo 2025',
    year: 2025,
    term: 2,
    startsAt: null,
    endsAt: null,
    isActive: false,
  },
]

describe('scheduleFilters', () => {
  it('ordena periodos por año y término descendente', () => {
    expect(sortAcademicPeriods(periods).map((period) => period.id)).toEqual(['p1', 'p2'])
  })

  it('navega al periodo anterior y siguiente', () => {
    expect(getAdjacentPeriodId(periods, 'p1', 1)).toBe('p2')
    expect(getAdjacentPeriodId(periods, 'p2', -1)).toBe('p1')
  })

  it('usa el nombre oficial del periodo cuando existe', () => {
    expect(formatAcademicPeriodLabel(periods[0]!)).toBe('Primer Periodo 2026')
  })

  it('detecta filtros activos', () => {
    expect(isScheduleViewFiltersActive(DEFAULT_SCHEDULE_VIEW_FILTERS)).toBe(false)
    expect(
      isScheduleViewFiltersActive({
        ...DEFAULT_SCHEDULE_VIEW_FILTERS,
        days: [1, 2, 3, 4, 5],
      }),
    ).toBe(true)
  })

  it('filtra secciones por día y horario', () => {
    const section = {
      id: 's1',
      meetings: [{ dayOfWeek: 2, startTime: '08:00', endTime: '10:00' }],
    } as CourseSection

    expect(sectionMatchesViewFilters(section, DEFAULT_SCHEDULE_VIEW_FILTERS)).toBe(true)
    expect(
      sectionMatchesViewFilters(section, {
        ...DEFAULT_SCHEDULE_VIEW_FILTERS,
        days: [1],
      }),
    ).toBe(false)
  })
})
