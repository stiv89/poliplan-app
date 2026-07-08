export interface BrevoEmailPayload {
  to: string
  subject: string
  html: string
  tags?: string[]
}

export async function sendBrevoEmail(payload: BrevoEmailPayload): Promise<void> {
  const apiKey = Deno.env.get('BREVO_API_KEY') ?? Deno.env.get('BREVOKEY')
  const fromEmail = Deno.env.get('EMAIL_FROM') ?? 'noreply@poliplan.app'
  const fromName = Deno.env.get('EMAIL_FROM_NAME') ?? 'PoliPlan'

  if (!apiKey) {
    throw new Error('Falta BREVO_API_KEY o BREVOKEY en secrets de la Edge Function')
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      tags: payload.tags,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Brevo error ${response.status}: ${detail}`)
  }
}
