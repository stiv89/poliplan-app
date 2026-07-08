import { useContext } from 'react'
import {
  ScheduleContext,
  type ScheduleContextValue,
} from '@/features/schedule/ScheduleContext'
import type { ScheduleVersion } from '@/types/academic'

export function useSchedule(): ScheduleContextValue {
  const context = useContext(ScheduleContext)
  if (!context) {
    throw new Error('useSchedule debe usarse dentro de ScheduleProvider')
  }
  return context
}

export function useScheduleVersion(): ScheduleVersion | null {
  const { lastUpdated, activePeriod } = useSchedule()
  if (!activePeriod || !lastUpdated) {
    return null
  }

  return {
    id: `${activePeriod.id}-cached`,
    academicPeriodId: activePeriod.id,
    version: 1,
    sourceUrl: null,
    sourceFileName: null,
    sourceChecksum: null,
    sourceModifiedAt: null,
    importedAt: lastUpdated,
    isActive: true,
    importStatus: 'cached',
    errorMessage: null,
  }
}
