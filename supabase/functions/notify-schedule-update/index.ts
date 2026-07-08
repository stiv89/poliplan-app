import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import { sendBrevoEmail } from '../_shared/email/brevo.ts'
import { renderScheduleUpdateEmail } from '../_shared/email/templates.ts'

interface NotifyRequest {
  periodId: string
  periodName?: string
}

interface RecipientRow {
  user_id: string
  email: string
  schedule_names: string[]
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = request.headers.get('Authorization') ?? ''
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!serviceRole || authHeader !== `Bearer ${serviceRole}`) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: NotifyRequest
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.periodId) {
    return jsonResponse({ error: 'periodId is required' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl) {
    return jsonResponse({ error: 'Missing SUPABASE_URL' }, 500)
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let periodName = body.periodName?.trim()
  if (!periodName) {
    const { data: period } = await admin
      .from('academic_periods')
      .select('name')
      .eq('id', body.periodId)
      .maybeSingle()
    periodName = period?.name ?? 'tu periodo académico'
  }

  const { data: recipients, error: recipientsError } = await admin.rpc(
    'get_schedule_update_recipients',
    { p_period_id: body.periodId },
  )

  if (recipientsError) {
    console.error('notify-schedule-update', recipientsError.message)
    return jsonResponse({ error: recipientsError.message }, 500)
  }

  const rows = (recipients ?? []) as RecipientRow[]
  let sent = 0
  const failures: string[] = []

  for (const row of rows) {
    if (!row.email) continue
    try {
      await sendBrevoEmail({
        to: row.email,
        subject: `Horario actualizado — ${periodName}`,
        html: renderScheduleUpdateEmail({
          periodName,
          scheduleNames: row.schedule_names ?? [],
        }),
        tags: ['schedule-update', body.periodId],
      })
      sent += 1
    } catch (error) {
      failures.push(row.email)
      console.error('notify-schedule-update', row.email, error)
    }
  }

  return jsonResponse({
    periodId: body.periodId,
    periodName,
    recipients: rows.length,
    sent,
    failures,
  })
})
