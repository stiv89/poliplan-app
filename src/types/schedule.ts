export type { ScheduleConflict, ScheduleConflictType, SyncStatus, UserSchedule } from './academic'

export interface SelectedSectionRecord {
  id: string
  sectionId: string
  courseId: string
  academicPeriodId: string
  createdAt: string
}

export interface AppSettings {
  id: string
  selectedCareerId: string | null
  selectedAcademicPeriodId: string | null
  theme: 'light' | 'dark' | 'system'
  updatedAt: string
}

export interface LocalScheduleVersionRecord {
  academicPeriodId: string
  version: number
  downloadedAt: string
  checksum: string | null
}

export interface SyncQueueItem {
  id: string
  entityType: string
  operation: string
  payload: Record<string, unknown>
  createdAt: string
  retryCount: number
  status: 'pending' | 'processing' | 'failed' | 'done'
}
