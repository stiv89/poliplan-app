import { getSupabaseClient } from '@/lib/supabase'
import type { SharedScheduleSnapshot } from '@/types/sharedSchedule'
import {
  decodeSharedSchedulePayload,
  encodeSharedSchedulePayload,
  isSharedScheduleUuid,
} from '@/utils/sharedScheduleCodec'

interface SharedScheduleRow {
  id: string
  name: string
  academic_period_id: string
  selected_career_id: string | null
  section_ids: string[]
}

export function buildSharedScheduleUrl(ref: string): string {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ??
        'https://www.poliplan.app'
  return `${origin}/compartir/${encodeURIComponent(ref)}`
}

export async function publishSharedSchedule(
  snapshot: SharedScheduleSnapshot,
): Promise<string> {
  if (snapshot.sectionIds.length === 0) {
    throw new Error('empty')
  }

  const client = getSupabaseClient()
  if (client) {
    const { data, error } = await client
      .from('shared_schedules')
      .insert({
        name: snapshot.name.trim() || 'Horario compartido',
        academic_period_id: snapshot.academicPeriodId,
        selected_career_id: snapshot.selectedCareerId,
        section_ids: snapshot.sectionIds,
      })
      .select('id')
      .single()

    if (error) throw error
    return String(data.id)
  }

  const encoded = encodeSharedSchedulePayload(snapshot)
  if (encoded.length > 1800) {
    throw new Error('too-large')
  }
  return encoded
}

export async function resolveSharedSchedule(ref: string): Promise<SharedScheduleSnapshot | null> {
  const token = decodeURIComponent(ref)

  if (isSharedScheduleUuid(token)) {
    const client = getSupabaseClient()
    if (!client) return null

    const { data, error } = await client
      .from('shared_schedules')
      .select('id, name, academic_period_id, selected_career_id, section_ids')
      .eq('id', token)
      .maybeSingle()

    if (error || !data) return null

    const row = data as SharedScheduleRow
    return {
      name: row.name,
      academicPeriodId: row.academic_period_id,
      selectedCareerId: row.selected_career_id,
      sectionIds: row.section_ids ?? [],
    }
  }

  return decodeSharedSchedulePayload(token)
}
