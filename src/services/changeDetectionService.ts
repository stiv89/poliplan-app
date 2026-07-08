/**
 * changeDetectionService.ts
 *
 * Compara dos snapshots de datos académicos (versión anterior vs. nueva)
 * y produce una lista de ScheduleChange ordenada por severidad.
 *
 * Severidades:
 *   critical      — fecha/hora de examen cambiada, sección eliminada de horario del usuario
 *   important     — día/hora/aula de clase cambiada
 *   informational — docente cambiado, nueva sección disponible
 */

import { db } from '@/db/database'
import type { CourseSection, ScheduleChange, ChangeSeverity, ChangeField } from '@/types/academic'
import type { DetectedChangeRecord } from '@/types/schedule'

// ── helpers ─────────────────────────────────────────────────────────────────

function toRecord(change: ScheduleChange): DetectedChangeRecord {
  return { ...change }
}

function makeChange(
  params: Omit<ScheduleChange, 'id' | 'detectedAt' | 'seen'>,
): ScheduleChange {
  return {
    ...params,
    id: crypto.randomUUID(),
    detectedAt: new Date().toISOString(),
    seen: false,
  }
}

function severity(field: ChangeField): ChangeSeverity {
  switch (field) {
    case 'examDate':
    case 'examTime':
    case 'sectionRemoved':
      return 'critical'
    case 'meetingDay':
    case 'meetingTime':
    case 'meetingClassroom':
    case 'examClassroom':
      return 'important'
    default:
      return 'informational'
  }
}

// ── núcleo de comparación ────────────────────────────────────────────────────

export interface CompareOptions {
  previousSections: CourseSection[]
  newSections: CourseSection[]
  coursesById: Map<string, { name: string }>
  selectedSectionIds: Set<string>
  versionFrom: number
  versionTo: number
}

/**
 * Compara dos listas de secciones y devuelve los cambios detectados.
 * No persiste nada — el llamador decide qué hacer con el resultado.
 */
export function detectChanges(options: CompareOptions): ScheduleChange[] {
  const {
    previousSections,
    newSections,
    coursesById,
    selectedSectionIds,
    versionFrom,
    versionTo,
  } = options

  const changes: ScheduleChange[] = []

  const prevById = new Map(previousSections.map((s) => [s.id, s]))
  const newById = new Map(newSections.map((s) => [s.id, s]))

  // Secciones que existían antes
  for (const prev of previousSections) {
    const courseName = coursesById.get(prev.courseId)?.name ?? 'Materia desconocida'
    const base = {
      sectionId: prev.id,
      courseId: prev.courseId,
      courseName,
      sectionCode: prev.sectionCode,
      versionFrom,
      versionTo,
    }

    const next = newById.get(prev.id)

    // Sección eliminada
    if (!next) {
      const field: ChangeField = 'sectionRemoved'
      changes.push(
        makeChange({
          ...base,
          entityType: 'section',
          field,
          previousValue: prev.sectionCode,
          newValue: null,
          severity: selectedSectionIds.has(prev.id) ? 'critical' : 'informational',
        }),
      )
      continue
    }

    // Docente
    if (prev.teacherName !== next.teacherName) {
      const field: ChangeField = 'teacherName'
      changes.push(
        makeChange({
          ...base,
          entityType: 'section',
          field,
          previousValue: prev.teacherName,
          newValue: next.teacherName,
          severity: severity(field),
        }),
      )
    }

    // Clases (meetings)
    const prevMeetings = prev.meetings ?? []
    const nextMeetings = next.meetings ?? []

    // Comparamos por índice de posición (mismo orden implícito del importador)
    const maxMeetings = Math.max(prevMeetings.length, nextMeetings.length)
    for (let i = 0; i < maxMeetings; i++) {
      const pm = prevMeetings[i]
      const nm = nextMeetings[i]
      if (!pm || !nm) continue

      if (pm.dayOfWeek !== nm.dayOfWeek) {
        const field: ChangeField = 'meetingDay'
        changes.push(
          makeChange({
            ...base,
            entityType: 'meeting',
            field,
            previousValue: String(pm.dayOfWeek),
            newValue: String(nm.dayOfWeek),
            severity: severity(field),
          }),
        )
      }

      const prevTime = `${pm.startTime}–${pm.endTime}`
      const nextTime = `${nm.startTime}–${nm.endTime}`
      if (prevTime !== nextTime) {
        const field: ChangeField = 'meetingTime'
        changes.push(
          makeChange({
            ...base,
            entityType: 'meeting',
            field,
            previousValue: prevTime,
            newValue: nextTime,
            severity: severity(field),
          }),
        )
      }

      if (pm.classroom !== nm.classroom) {
        const field: ChangeField = 'meetingClassroom'
        changes.push(
          makeChange({
            ...base,
            entityType: 'meeting',
            field,
            previousValue: pm.classroom,
            newValue: nm.classroom,
            severity: severity(field),
          }),
        )
      }
    }

    // Exámenes
    const prevExams = prev.exams ?? []
    const nextExams = next.exams ?? []

    const maxExams = Math.max(prevExams.length, nextExams.length)
    for (let j = 0; j < maxExams; j++) {
      const pe = prevExams[j]
      const ne = nextExams[j]
      if (!pe || !ne) continue

      if (pe.examDate !== ne.examDate) {
        const field: ChangeField = 'examDate'
        changes.push(
          makeChange({
            ...base,
            entityType: 'exam',
            field,
            previousValue: pe.examDate,
            newValue: ne.examDate,
            severity: severity(field),
          }),
        )
      }

      const prevExamTime = pe.startTime ? `${pe.startTime}–${pe.endTime}` : null
      const nextExamTime = ne.startTime ? `${ne.startTime}–${ne.endTime}` : null
      if (prevExamTime !== nextExamTime) {
        const field: ChangeField = 'examTime'
        changes.push(
          makeChange({
            ...base,
            entityType: 'exam',
            field,
            previousValue: prevExamTime,
            newValue: nextExamTime,
            severity: severity(field),
          }),
        )
      }

      if (pe.classroom !== ne.classroom) {
        const field: ChangeField = 'examClassroom'
        changes.push(
          makeChange({
            ...base,
            entityType: 'exam',
            field,
            previousValue: pe.classroom,
            newValue: ne.classroom,
            severity: severity(field),
          }),
        )
      }
    }
  }

  // Secciones nuevas que no existían antes
  for (const next of newSections) {
    if (!prevById.has(next.id)) {
      const courseName = coursesById.get(next.courseId)?.name ?? 'Materia desconocida'
      const field: ChangeField = 'sectionAdded'
      changes.push(
        makeChange({
          entityType: 'section',
          sectionId: next.id,
          courseId: next.courseId,
          courseName,
          sectionCode: next.sectionCode,
          field,
          previousValue: null,
          newValue: next.sectionCode,
          severity: severity(field),
          versionFrom,
          versionTo,
        }),
      )
    }
  }

  return changes
}

// ── persistencia en IndexedDB ────────────────────────────────────────────────

/**
 * Persiste los cambios detectados en IndexedDB, evitando duplicados
 * (mismo sectionId + field + versionTo).
 */
export async function persistChanges(changes: ScheduleChange[]): Promise<void> {
  if (changes.length === 0) return

  // Filtra duplicados antes de insertar
  const existing = await db.detectedChanges
    .where('versionTo')
    .equals(changes[0]?.versionTo ?? 0)
    .toArray()

  const existingKeys = new Set(existing.map((c) => `${c.sectionId}:${c.field}:${c.versionTo}`))

  const toInsert = changes
    .filter((c) => !existingKeys.has(`${c.sectionId}:${c.field}:${c.versionTo}`))
    .map(toRecord)

  if (toInsert.length > 0) {
    await db.detectedChanges.bulkAdd(toInsert)
  }
}

/**
 * Carga todos los cambios de IndexedDB, separando vistos de no vistos.
 */
export async function loadChanges(): Promise<ScheduleChange[]> {
  const records = await db.detectedChanges
    .orderBy('detectedAt')
    .reverse()
    .toArray()

  return records as unknown as ScheduleChange[]
}

/**
 * Marca un cambio como visto.
 */
export async function markChangeSeen(changeId: string): Promise<void> {
  await db.transaction('rw', [db.detectedChanges, db.seenChanges], async () => {
    await db.detectedChanges.update(changeId, { seen: true })
    await db.seenChanges.put({ id: changeId, seenAt: new Date().toISOString() })
  })
}

/**
 * Marca todos los cambios no vistos como vistos.
 */
export async function markAllChangesSeen(): Promise<void> {
  const unseen = await db.detectedChanges.where('seen').equals(0).toArray()
  const now = new Date().toISOString()

  await db.transaction('rw', [db.detectedChanges, db.seenChanges], async () => {
    for (const c of unseen) {
      await db.detectedChanges.update(c.id, { seen: true })
      await db.seenChanges.put({ id: c.id, seenAt: now })
    }
  })
}

/**
 * Cuenta cambios no vistos (para badges en la UI).
 */
export async function countUnseenChanges(): Promise<number> {
  return db.detectedChanges.where('seen').equals(0).count()
}
