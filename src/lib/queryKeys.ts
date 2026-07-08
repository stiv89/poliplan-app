export const queryKeys = {
  academicPeriods: ['academicPeriods'] as const,
  activePeriod: ['activeAcademicPeriod'] as const,
  careers: (periodId: string) => ['careers', periodId] as const,
  courses: (periodId: string, careerId: string) =>
    ['courses', periodId, careerId] as const,
  sections: (periodId: string, courseId: string) =>
    ['sections', periodId, courseId] as const,
  section: (sectionId: string) => ['section', sectionId] as const,
  selectedSections: (periodId: string) => ['selectedSections', periodId] as const,
  syncStatus: ['syncStatus'] as const,
  settings: ['settings'] as const,
}
