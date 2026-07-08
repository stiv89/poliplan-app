export const DB_VERSION = 1

export const DEFAULT_SETTINGS = {
  id: 'app-settings',
  selectedCareerId: null,
  selectedAcademicPeriodId: null,
  activeScheduleId: null,
  theme: 'light' as const,
  autoSyncEnabled: true,
  syncOnOpen: true,
  showChangeAlerts: true,
  syncPromptDismissedAt: null,
  notificationPromptDismissedAt: null,
  scheduleTourCompletedAt: null,
  lastUserScheduleSyncAt: null,
  remoteScheduleByLocalId: {} as Record<string, string>,
  updatedAt: new Date().toISOString(),
}
