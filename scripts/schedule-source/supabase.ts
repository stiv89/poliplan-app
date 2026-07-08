import { createClient } from '@supabase/supabase-js'
import type { SupabaseScheduleCheck } from './types'

export async function compareWithSupabase(
  checksum: string,
  periodId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<SupabaseScheduleCheck> {
  const url = env.SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return {
      available: false,
      blockedReason: 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY',
      alreadyProcessed: false,
      lastSuccessfulChecksum: null,
      lastActiveVersion: null,
      lastSuccessfulImport: null,
    }
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [versionMatch, importMatch, activeVersion, lastImport] = await Promise.all([
    client
      .from('schedule_versions')
      .select('id, version, source_checksum, import_status, imported_at')
      .eq('source_checksum', checksum)
      .eq('import_status', 'success')
      .order('imported_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('schedule_imports')
      .select('id, checksum, status, finished_at')
      .eq('checksum', checksum)
      .eq('status', 'success')
      .order('finished_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('schedule_versions')
      .select('id, version, source_checksum, import_status')
      .eq('academic_period_id', periodId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('schedule_imports')
      .select('id, checksum, status')
      .order('finished_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const firstError = versionMatch.error ?? importMatch.error ?? activeVersion.error ?? lastImport.error
  if (firstError) {
    throw firstError
  }

  return {
    available: true,
    alreadyProcessed: Boolean(versionMatch.data || importMatch.data),
    lastSuccessfulChecksum:
      (versionMatch.data?.source_checksum as string | null | undefined) ??
      (importMatch.data?.checksum as string | null | undefined) ??
      null,
    lastActiveVersion: activeVersion.data
      ? {
          id: activeVersion.data.id,
          version: activeVersion.data.version,
          checksum: activeVersion.data.source_checksum ?? null,
          status: activeVersion.data.import_status ?? null,
        }
      : null,
    lastSuccessfulImport: lastImport.data
      ? {
          id: lastImport.data.id,
          checksum: lastImport.data.checksum ?? null,
          status: lastImport.data.status ?? null,
        }
      : null,
  }
}
