import { db } from '@/db/database'
import iinCurriculum from '@/data/curricula/iin-default.json'
import type {
  AcademicAttempt,
  AcademicImportRecord,
  AcademicProfile,
  Curriculum,
  TranscriptParseRow,
} from '@/types/academicHistory'
import { deriveAttemptStatus } from '@/utils/academicApproval'
import { normalizeCourseName } from '@/utils/courseMatching'

export const LOCAL_ACADEMIC_PROFILE_ID = 'local-academic-profile'

const DEFAULT_CURRICULUM = iinCurriculum as Curriculum

async function ensureCurriculumSeeded(): Promise<Curriculum> {
  const existing = await db.curricula.get(DEFAULT_CURRICULUM.id)
  if (!existing) {
    await db.curricula.put(DEFAULT_CURRICULUM)
  }
  return (await db.curricula.get(DEFAULT_CURRICULUM.id)) ?? DEFAULT_CURRICULUM
}

export async function ensureAcademicProfile(): Promise<AcademicProfile> {
  await ensureCurriculumSeeded()
  const existing = await db.academicProfiles.get(LOCAL_ACADEMIC_PROFILE_ID)
  if (existing) return existing

  const profile: AcademicProfile = {
    id: LOCAL_ACADEMIC_PROFILE_ID,
    curriculumId: DEFAULT_CURRICULUM.id,
    careerCode: DEFAULT_CURRICULUM.careerCode,
    careerName: DEFAULT_CURRICULUM.name,
    importedGpa: null,
    updatedAt: new Date().toISOString(),
  }
  await db.academicProfiles.put(profile)
  return profile
}

export async function getCurriculum(curriculumId?: string): Promise<Curriculum> {
  const id = curriculumId ?? DEFAULT_CURRICULUM.id
  const curriculum = await db.curricula.get(id)
  return curriculum ?? ensureCurriculumSeeded()
}

export async function getAcademicProfile(): Promise<AcademicProfile> {
  return ensureAcademicProfile()
}

export async function getAttempts(): Promise<AcademicAttempt[]> {
  await ensureAcademicProfile()
  return db.academicAttempts
    .where('localProfileId')
    .equals(LOCAL_ACADEMIC_PROFILE_ID)
    .sortBy('examDate')
}

export async function saveAttempt(
  attempt: Omit<AcademicAttempt, 'id' | 'createdAt' | 'updatedAt' | 'localProfileId'> & {
    id?: string
  },
): Promise<AcademicAttempt> {
  await ensureAcademicProfile()
  const now = new Date().toISOString()
  const record: AcademicAttempt = {
    ...attempt,
    id: attempt.id ?? crypto.randomUUID(),
    localProfileId: LOCAL_ACADEMIC_PROFILE_ID,
    normalizedCourseName: attempt.normalizedCourseName || normalizeCourseName(attempt.originalCourseName),
    createdAt: now,
    updatedAt: now,
  }
  await db.academicAttempts.put(record)
  await touchProfile()
  return record
}

export async function deleteAttempt(id: string): Promise<void> {
  await db.academicAttempts.delete(id)
  await touchProfile()
}

export async function confirmPdfImport(
  rows: TranscriptParseRow[],
  importMeta: { fileName: string; gpa?: number | null },
): Promise<AcademicImportRecord> {
  const profile = await ensureAcademicProfile()
  const importId = crypto.randomUUID()
  const now = new Date().toISOString()

  const importRecord: AcademicImportRecord = {
    id: importId,
    localProfileId: profile.id,
    source: 'pdf',
    fileName: importMeta.fileName,
    rowCount: rows.filter((r) => !r.ignored).length,
    confirmedAt: now,
    createdAt: now,
  }

  await db.transaction('rw', [db.academicAttempts, db.academicImports, db.academicProfiles], async () => {
    for (const row of rows) {
      if (row.ignored) continue
      await db.academicAttempts.put({
        id: crypto.randomUUID(),
        localProfileId: profile.id,
        courseId: row.matchedCourseId,
        originalCourseName: row.originalCourseName,
        normalizedCourseName: row.normalizedCourseName,
        matchedCourseId: row.matchedCourseId ?? null,
        matchConfidence: row.matchConfidence,
        electiveSlot: row.electiveSlot ?? null,
        specificElectiveName: row.specificElectiveName ?? null,
        semesterNumber: row.semesterNumber ?? null,
        examDate: row.examDate ?? null,
        recordNumber: row.recordNumber ?? null,
        score: row.score ?? null,
        finalGrade: row.finalGrade ?? null,
        status: row.status,
        source: 'pdf_import',
        importId,
        createdAt: now,
        updatedAt: now,
      })
    }

    await db.academicImports.put(importRecord)
    await db.academicProfiles.update(profile.id, {
      importedGpa: importMeta.gpa ?? profile.importedGpa ?? null,
      updatedAt: now,
    })
  })

  return importRecord
}

export async function addSemesterCourses(
  courseIds: string[],
  options?: { grades?: Record<string, number | null> },
): Promise<void> {
  const profile = await ensureAcademicProfile()
  const curriculum = await getCurriculum(profile.curriculumId)

  for (const courseId of courseIds) {
    const course = curriculum.courses.find((c) => c.id === courseId)
    if (!course) continue
    const grade = options?.grades?.[courseId] ?? null
    await saveAttempt({
      courseId,
      matchedCourseId: courseId,
      originalCourseName: course.name,
      normalizedCourseName: normalizeCourseName(course.name),
      matchConfidence: 'exact',
      semesterNumber: course.semesterNumber,
      finalGrade: grade,
      status: grade != null ? deriveAttemptStatus(grade) : 'passed',
      source: 'semester_selection',
    })
  }
}

async function touchProfile(): Promise<void> {
  await db.academicProfiles.update(LOCAL_ACADEMIC_PROFILE_ID, {
    updatedAt: new Date().toISOString(),
  })
}

export async function updateProfileGpa(gpa: number | null): Promise<void> {
  await db.academicProfiles.update(LOCAL_ACADEMIC_PROFILE_ID, {
    importedGpa: gpa,
    updatedAt: new Date().toISOString(),
  })
}

export async function clearAcademicHistory(): Promise<void> {
  await db.transaction('rw', [db.academicAttempts, db.academicImports], async () => {
    await db.academicAttempts.where('localProfileId').equals(LOCAL_ACADEMIC_PROFILE_ID).delete()
    await db.academicImports.where('localProfileId').equals(LOCAL_ACADEMIC_PROFILE_ID).delete()
  })
  await touchProfile()
}
