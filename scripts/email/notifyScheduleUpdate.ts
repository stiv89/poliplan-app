/**
 * Notifica por correo a usuarios con horarios en un periodo actualizado.
 * Llama a la Edge Function notify-schedule-update (Brevo).
 */
import { loadAdminEnv } from '../admin/load-env.ts'

export async function notifyScheduleUpdate(options: {
  periodId: string
  periodName?: string
}): Promise<{ sent: number; recipients: number } | null> {
  loadAdminEnv()

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRole) {
    console.warn('notifyScheduleUpdate: faltan credenciales Supabase, se omite.')
    return null
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/notify-schedule-update`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRole}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      periodId: options.periodId,
      periodName: options.periodName,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.warn(`notifyScheduleUpdate falló (${response.status}): ${detail}`)
    return null
  }

  const result = (await response.json()) as { sent?: number; recipients?: number }
  return {
    sent: result.sent ?? 0,
    recipients: result.recipients ?? 0,
  }
}
