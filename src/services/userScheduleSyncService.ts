import { getSupabaseClient } from '@/lib/supabase'
import { localScheduleRepository } from '@/repositories/LocalScheduleRepository'
import type { SavedScheduleRecord } from '@/types/schedule'

export type ScheduleConflictResolution = 'local' | 'remote' | 'merge'

export interface RemoteUserSchedule {
  id: string
  academicPeriodId: string
  name: string
  updatedAt: string
  sectionIds: string[]
}

export type UserScheduleSyncResult =
  | { type: 'uploaded' }
  | { type: 'downloaded' }
  | { type: 'merged' }
  | { type: 'already-synced' }
  | { type: 'empty' }
  | {
      type: 'conflict'
      remote: RemoteUserSchedule
      localSectionIds: string[]
    }

interface RemoteScheduleRow {
  id: string
  academic_period_id: string
  name: string
  updated_at: string
  user_schedule_sections: Array<{ section_id: string }> | null
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}

export async function fetchRemoteSchedules(userId: string): Promise<RemoteUserSchedule[]> {
  const client = getSupabaseClient()
  if (!client) return []

  const { data, error } = await client
    .from('user_schedules')
    .select('id, academic_period_id, name, updated_at, user_schedule_sections(section_id)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as RemoteScheduleRow[]).map((row) => ({
    id: row.id,
    academicPeriodId: row.academic_period_id,
    name: row.name,
    updatedAt: row.updated_at,
    sectionIds: (row.user_schedule_sections ?? []).map((item) => item.section_id),
  }))
}

async function replaceRemoteSections(remoteScheduleId: string, sectionIds: string[]): Promise<void> {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado')

  const { error: deleteError } = await client
    .from('user_schedule_sections')
    .delete()
    .eq('user_schedule_id', remoteScheduleId)

  if (deleteError) throw deleteError

  if (sectionIds.length === 0) return

  const { error: insertError } = await client.from('user_schedule_sections').insert(
    sectionIds.map((sectionId) => ({
      user_schedule_id: remoteScheduleId,
      section_id: sectionId,
    })),
  )

  if (insertError) throw insertError
}

export async function uploadLocalSchedule(
  userId: string,
  schedule: SavedScheduleRecord,
  sectionIds: string[],
  remoteScheduleId?: string,
): Promise<string> {
  const client = getSupabaseClient()
  if (!client) throw new Error('Supabase no está configurado')

  let remoteId = remoteScheduleId

  if (remoteId) {
    const { error } = await client
      .from('user_schedules')
      .update({ name: schedule.name })
      .eq('id', remoteId)
      .eq('user_id', userId)

    if (error) throw error
  } else {
    const { data, error } = await client
      .from('user_schedules')
      .insert({
        user_id: userId,
        academic_period_id: schedule.academicPeriodId,
        name: schedule.name,
      })
      .select('id')
      .single()

    if (error) throw error
    remoteId = data.id as string
  }

  await replaceRemoteSections(remoteId, sectionIds)

  const settings = await localScheduleRepository.getSettings()
  await localScheduleRepository.updateSettings({
    lastUserScheduleSyncAt: new Date().toISOString(),
    remoteScheduleByLocalId: {
      ...settings.remoteScheduleByLocalId,
      [schedule.id]: remoteId,
    },
  })

  return remoteId
}

export async function applyRemoteScheduleToLocal(
  remote: RemoteUserSchedule,
  userId: string,
): Promise<void> {
  const settings = await localScheduleRepository.getSettings()
  const localMapping = Object.entries(settings.remoteScheduleByLocalId).find(
    ([, remoteId]) => remoteId === remote.id,
  )

  let localSchedule: SavedScheduleRecord | null = null

  if (localMapping) {
    localSchedule = await localScheduleRepository.getSavedScheduleById(localMapping[0])
  }

  if (!localSchedule) {
    const schedules = await localScheduleRepository.getSavedSchedules({
      academicPeriodId: remote.academicPeriodId,
    })
    localSchedule = schedules[0] ?? null
  }

  if (!localSchedule) {
    localSchedule = await localScheduleRepository.createSavedSchedule({
      name: remote.name,
      academicPeriodId: remote.academicPeriodId,
      selectedCareerId: settings.selectedCareerId,
    })
  } else if (localSchedule.name !== remote.name) {
    await localScheduleRepository.renameSavedSchedule(localSchedule.id, remote.name)
  }

  await localScheduleRepository.clearSelectedSections(localSchedule.id)

  for (const sectionId of remote.sectionIds) {
    const section = await localScheduleRepository.getSectionById(sectionId)
    if (!section) continue

    await localScheduleRepository.addSelectedSection({
      scheduleId: localSchedule.id,
      sectionId: section.id,
      courseId: section.courseId,
      academicPeriodId: remote.academicPeriodId,
    })
  }

  await localScheduleRepository.updateSettings({
    activeScheduleId: localSchedule.id,
    selectedAcademicPeriodId: remote.academicPeriodId,
    lastUserScheduleSyncAt: new Date().toISOString(),
    remoteScheduleByLocalId: {
      ...settings.remoteScheduleByLocalId,
      [localSchedule.id]: remote.id,
    },
  })

  void userId
}

export async function mergeRemoteAndLocal(
  remote: RemoteUserSchedule,
  localSchedule: SavedScheduleRecord,
  localSectionIds: string[],
  userId: string,
): Promise<void> {
  const merged = [...new Set([...localSectionIds, ...remote.sectionIds])]
  await uploadLocalSchedule(userId, localSchedule, merged, remote.id)

  await localScheduleRepository.clearSelectedSections(localSchedule.id)
  for (const sectionId of merged) {
    const section = await localScheduleRepository.getSectionById(sectionId)
    if (!section) continue

    await localScheduleRepository.addSelectedSection({
      scheduleId: localSchedule.id,
      sectionId: section.id,
      courseId: section.courseId,
      academicPeriodId: localSchedule.academicPeriodId,
    })
  }
}

export async function evaluateUserScheduleSync(userId: string): Promise<UserScheduleSyncResult> {
  const settings = await localScheduleRepository.getSettings()
  const periodId = settings.selectedAcademicPeriodId
  if (!periodId) return { type: 'empty' }

  const schedule = await localScheduleRepository.resolveActiveSchedule(
    periodId,
    settings.activeScheduleId,
    settings.selectedCareerId,
  )

  const localRecords = await localScheduleRepository.getSelectedSections(schedule.id)
  const localSectionIds = localRecords.map((record) => record.sectionId)

  const remotes = await fetchRemoteSchedules(userId)
  const mappedRemoteId = settings.remoteScheduleByLocalId[schedule.id]
  const remote =
    remotes.find((item) => item.id === mappedRemoteId) ??
    remotes.find((item) => item.academicPeriodId === periodId) ??
    null

  if (!remote) {
    if (localSectionIds.length === 0) return { type: 'empty' }
    return { type: 'uploaded' }
  }

  if (localSectionIds.length === 0) {
    return { type: 'downloaded' }
  }

  const localSet = new Set(localSectionIds)
  const remoteSet = new Set(remote.sectionIds)

  if (setsEqual(localSet, remoteSet)) {
    return { type: 'already-synced' }
  }

  return { type: 'conflict', remote, localSectionIds }
}

export async function syncUserScheduleAfterLogin(
  userId: string,
  resolution?: ScheduleConflictResolution,
): Promise<UserScheduleSyncResult> {
  const evaluation = await evaluateUserScheduleSync(userId)

  if (evaluation.type === 'empty') return evaluation
  if (evaluation.type === 'already-synced') return evaluation

  const settings = await localScheduleRepository.getSettings()
  const schedule = await localScheduleRepository.resolveActiveSchedule(
    settings.selectedAcademicPeriodId!,
    settings.activeScheduleId,
    settings.selectedCareerId,
  )

  if (evaluation.type === 'uploaded') {
    const localRecords = await localScheduleRepository.getSelectedSections(schedule.id)
    const remoteId = settings.remoteScheduleByLocalId[schedule.id]
    await uploadLocalSchedule(
      userId,
      schedule,
      localRecords.map((record) => record.sectionId),
      remoteId,
    )
    return { type: 'uploaded' }
  }

  if (evaluation.type === 'downloaded') {
    const remotes = await fetchRemoteSchedules(userId)
    const remote = remotes.find((item) => item.academicPeriodId === schedule.academicPeriodId)
    if (!remote) return { type: 'empty' }
    await applyRemoteScheduleToLocal(remote, userId)
    return { type: 'downloaded' }
  }

  if (evaluation.type === 'conflict') {
    if (!resolution) return evaluation

    if (resolution === 'local') {
      await uploadLocalSchedule(
        userId,
        schedule,
        evaluation.localSectionIds,
        evaluation.remote.id,
      )
      return { type: 'uploaded' }
    }

    if (resolution === 'remote') {
      await applyRemoteScheduleToLocal(evaluation.remote, userId)
      return { type: 'downloaded' }
    }

    await mergeRemoteAndLocal(
      evaluation.remote,
      schedule,
      evaluation.localSectionIds,
      userId,
    )
    return { type: 'merged' }
  }

  return evaluation
}

export async function syncUserScheduleForAuthenticatedUser(userId: string): Promise<void> {
  const result = await syncUserScheduleAfterLogin(userId, 'local')
  if (result.type === 'conflict') {
    throw new Error('Conflicto de horario pendiente de resolver')
  }
}
