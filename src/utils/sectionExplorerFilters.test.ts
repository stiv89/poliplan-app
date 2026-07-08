import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_SCHEDULE_VIEW_FILTERS } from '@/types/scheduleFilters'
import {
  buildActiveExplorerFilterChips,
  clearSectionExplorerFilters,
  countSectionExplorerFilters,
  semesterOptions,
} from '@/utils/sectionExplorerFilters'

describe('sectionExplorerFilters', () => {
  it('cuenta filtros activos de semestre, turno, días y horario', () => {
    expect(
      countSectionExplorerFilters({
        semesterFilter: null,
        shiftFilter: null,
        viewFilters: DEFAULT_SCHEDULE_VIEW_FILTERS,
      }),
    ).toBe(0)

    expect(
      countSectionExplorerFilters({
        semesterFilter: 5,
        shiftFilter: 'Tarde',
        viewFilters: {
          ...DEFAULT_SCHEDULE_VIEW_FILTERS,
          days: [1, 2, 3, 4, 5],
        },
      }),
    ).toBe(3)

    expect(
      countSectionExplorerFilters({
        semesterFilter: null,
        shiftFilter: null,
        viewFilters: {
          ...DEFAULT_SCHEDULE_VIEW_FILTERS,
          timeStartMinutes: 480,
          timeEndMinutes: 960,
        },
      }),
    ).toBe(1)
  })

  it('genera chips explícitos para filtros activos', () => {
    const onSemesterChange = vi.fn()
    const onShiftChange = vi.fn()
    const onViewFiltersChange = vi.fn()

    const chips = buildActiveExplorerFilterChips({
      semesterFilter: 5,
      shiftFilter: 'Tarde',
      viewFilters: {
        ...DEFAULT_SCHEDULE_VIEW_FILTERS,
        days: [1],
      },
      onSemesterChange,
      onShiftChange,
      onViewFiltersChange,
    })

    expect(chips.map((chip) => chip.label)).toEqual(['5.º semestre', 'Turno: Tarde', 'Lunes'])

    chips[0]?.onRemove()
    expect(onSemesterChange).toHaveBeenCalledWith(null)

    chips[1]?.onRemove()
    expect(onShiftChange).toHaveBeenCalledWith(null)

    chips[2]?.onRemove()
    expect(onViewFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_SCHEDULE_VIEW_FILTERS,
      days: [],
    })
  })

  it('restablece todos los filtros al limpiar', () => {
    const onSemesterChange = vi.fn()
    const onShiftChange = vi.fn()
    const onViewFiltersChange = vi.fn()

    clearSectionExplorerFilters(onSemesterChange, onShiftChange, onViewFiltersChange)

    expect(onSemesterChange).toHaveBeenCalledWith(null)
    expect(onShiftChange).toHaveBeenCalledWith(null)
    expect(onViewFiltersChange).toHaveBeenCalledWith(DEFAULT_SCHEDULE_VIEW_FILTERS)
  })

  it('expone opciones de semestre del 1.º al 10.º', () => {
    expect(semesterOptions()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})
