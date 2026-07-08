import { normalizeTeacherName } from '../../../src/utils/teacher.ts'

export interface ResolvedTeacher {
  id: string
  name: string
  email: string | null
  nameNormalized: string
}

export function buildTeacherRecords(
  sections: Array<{ teacherName: string | null; teacherEmail: string | null }>,
): ResolvedTeacher[] {
  const byKey = new Map<string, ResolvedTeacher>()

  for (const section of sections) {
    const name = section.teacherName?.trim() ?? ''
    const email = section.teacherEmail?.trim().toLowerCase() ?? ''
    if (!name && !email) continue

    const nameNormalized = normalizeTeacherName(name) ?? email
    const key = email ? `email:${email}` : `name:${nameNormalized}`

    if (!byKey.has(key)) {
      byKey.set(key, {
        id: crypto.randomUUID(),
        name: name || email,
        email: email || null,
        nameNormalized,
      })
    }
  }

  return [...byKey.values()]
}

export function resolveTeacherIdForSection(
  teacherMap: Map<string, string>,
  teacherName: string | null,
  teacherEmail: string | null,
): string | null {
  const name = teacherName?.trim() ?? ''
  const email = teacherEmail?.trim().toLowerCase() ?? ''
  if (!name && !email) return null

  const nameNormalized = normalizeTeacherName(name) ?? email
  const key = email ? `email:${email}` : `name:${nameNormalized}`
  return teacherMap.get(key) ?? null
}

export function teacherMapKey(name: string | null, email: string | null): string | null {
  const trimmedEmail = email?.trim().toLowerCase() ?? ''
  if (trimmedEmail) return `email:${trimmedEmail}`

  const normalizedName = normalizeTeacherName(name)
  if (normalizedName) return `name:${normalizedName}`

  return null
}
