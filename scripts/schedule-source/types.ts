export type ScheduleLinkKind =
  | 'excel'
  | 'drive-folder'
  | 'drive-file'
  | 'download'
  | 'page'
  | 'pdf'
  | 'other'

export interface ScheduleLinkCandidate {
  href: string
  absoluteUrl: string
  text: string
  context: string
  kind: ScheduleLinkKind
  score: number
  driveFileId?: string
}

export interface OfficialPageSnapshot {
  requestedUrl: string
  finalUrl: string
  status: number
  contentType: string
  html: string
  title: string
}

export interface ResolvedScheduleTarget {
  candidate: ScheduleLinkCandidate
  finalUrl: string
  finalText: string
  hops: string[]
}

export interface DownloadedScheduleFile {
  filePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
  responseUrl: string
}

export interface ValidatedScheduleFile extends DownloadedScheduleFile {
  sheetCount: number
  sheetNames: string[]
  academicSheetCount: number
}

export interface SupabaseScheduleCheck {
  available: boolean
  blockedReason?: string
  alreadyProcessed: boolean
  lastSuccessfulChecksum: string | null
  lastActiveVersion: {
    id: string
    version: number
    checksum: string | null
    status: string | null
  } | null
  lastSuccessfulImport: {
    id: string
    checksum: string | null
    status: string | null
  } | null
}

export interface ScheduleDryRunSummary {
  reportPath: string
  careers: number
  courses: number
  sections: number
  meetings: number
  exams: number
  warnings: number
  criticalErrors: number
  sheetCount: number
}

export interface ScheduleSourceReport {
  sourceUrl: string
  page: OfficialPageSnapshot
  linksFound: ScheduleLinkCandidate[]
  selectedLink: ScheduleLinkCandidate | null
  resolvedTarget: ResolvedScheduleTarget | null
  file: ValidatedScheduleFile | null
  checksum: string | null
  supabase: SupabaseScheduleCheck
  dryRun: ScheduleDryRunSummary | null
  status:
    | 'already-processed'
    | 'download-only'
    | 'dry-run-ok'
    | 'dry-run-with-errors'
    | 'failed'
}

export interface ScheduleSourceCheckOptions {
  sourceUrl: string
  dryRun: boolean
  downloadOnly: boolean
  output?: string
  verbose: boolean
  periodId?: string
}
