export type CourseFootnoteKind = 'final_exam_only' | 'lab_practices'

export interface CourseFootnoteInfo {
  kind: CourseFootnoteKind | null
  /** Nombre sin los marcadores ( * ) o ( ** ) del Excel oficial. */
  displayName: string
}

const FINAL_EXAM_ONLY = /\(\*\)/
const LAB_PRACTICES = /\(\*\*\)/

export function getCourseFootnote(name: string): CourseFootnoteInfo {
  let kind: CourseFootnoteKind | null = null

  if (FINAL_EXAM_ONLY.test(name)) {
    kind = 'final_exam_only'
  } else if (LAB_PRACTICES.test(name)) {
    kind = 'lab_practices'
  }

  const displayName = name
    .replace(/\s*\(\*\*\)\s*/g, ' ')
    .replace(/\s*\(\*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return { kind, displayName: displayName || name.trim() }
}

export function isFinalExamOnlyCourse(name: string): boolean {
  return FINAL_EXAM_ONLY.test(name)
}
