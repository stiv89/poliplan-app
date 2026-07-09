export interface SharedScheduleSnapshot {
  name: string
  academicPeriodId: string
  selectedCareerId: string | null
  sectionIds: string[]
}

export type SharedScheduleRef = string
