export const DB_VERSION = 1

export const DEFAULT_SETTINGS = {
  id: 'app-settings',
  selectedCareerId: null,
  selectedAcademicPeriodId: null,
  theme: 'light' as const,
  updatedAt: new Date().toISOString(),
}
