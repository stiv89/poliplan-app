export type { ScheduleConflict, ScheduleConflictType, SyncStatus, UserSchedule } from './academic'

export interface SavedScheduleRecord {
  id: string
  name: string
  academicPeriodId: string
  selectedCareerId: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SelectedSectionRecord {
  id: string
  scheduleId: string
  sectionId: string
  courseId: string
  academicPeriodId: string
  createdAt: string
}

export interface AppSettings {
  id: string
  selectedCareerId: string | null
  selectedAcademicPeriodId: string | null
  activeScheduleId: string | null
  theme: 'light' | 'dark' | 'system'
  autoSyncEnabled: boolean
  syncOnOpen: boolean
  showChangeAlerts: boolean
  /** ISO timestamp — cuándo el usuario descartó el prompt de sincronización */
  syncPromptDismissedAt: string | null
  /** ISO timestamp — cuándo el usuario descartó el prompt de notificaciones */
  notificationPromptDismissedAt: string | null
  teacherReviewPromptCompletedAt: string | null
  /** ISO timestamp — cuándo completó el tour de bienvenida del horario */
  scheduleTourCompletedAt: string | null
  /** ISO timestamp — cuándo eligió facultad en el modal de bienvenida */
  appWelcomeCompletedAt: string | null
  /** ISO timestamp — última sincronización del horario personal a la nube */
  lastUserScheduleSyncAt: string | null
  /** Mapeo localScheduleId → remote user_schedules.id */
  remoteScheduleByLocalId: Record<string, string>
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

/** Registro de IDs de cambios ya vistos por el usuario (IndexedDB) */
export interface SeenChangeRecord {
  /** Igual al ScheduleChange.id */
  id: string
  seenAt: string
}

/** Cambio detectado persistido en IndexedDB */
export interface DetectedChangeRecord {
  id: string
  entityType: string
  sectionId: string
  courseId: string
  courseName: string
  sectionCode: string
  field: string
  previousValue: string | null
  newValue: string | null
  severity: string
  detectedAt: string
  versionFrom: number
  versionTo: number
  seen: boolean
}
