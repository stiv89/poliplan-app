import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { sendBrevoEmail } from '../_shared/email/brevo.ts'
import {
  buildVerifyUrl,
  isLikelyNewUser,
  renderEmailChangeEmail,
  renderMagicLinkEmail,
  renderOtpEmail,
  renderRecoveryEmail,
} from '../_shared/email/templates.ts'

interface AuthEmailHookPayload {
  user: {
    email?: string
    created_at?: string
  }
  email_data: {
    token?: string
    token_hash?: string
    redirect_to?: string
    email_action_type?: string
    site_url?: string
  }
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function resolveAuthEmail(payload: AuthEmailHookPayload): {
  subject: string
  html: string
} {
  const action = payload.email_data.email_action_type ?? 'magiclink'
  const siteUrl = payload.email_data.site_url ?? Deno.env.get('SUPABASE_URL') ?? ''
  const redirectTo = payload.email_data.redirect_to ?? Deno.env.get('APP_URL') ?? 'https://poliplan.app'
  const isNewUser = isLikelyNewUser(payload.user.created_at)

  if (payload.email_data.token && !payload.email_data.token_hash) {
    return {
      subject: isNewUser ? 'Bienvenido a PoliPlan' : 'Tu código de acceso — PoliPlan',
      html: renderOtpEmail({ code: payload.email_data.token, isNewUser }),
    }
  }

  const verifyUrl = buildVerifyUrl({
    siteUrl,
    tokenHash: payload.email_data.token_hash ?? '',
    emailActionType: action,
    redirectTo,
  })

  switch (action) {
    case 'recovery':
      return {
        subject: 'Recuperar acceso — PoliPlan',
        html: renderRecoveryEmail(verifyUrl),
      }
    case 'email_change':
    case 'email_change_new':
      return {
        subject: 'Confirmar nuevo correo — PoliPlan',
        html: renderEmailChangeEmail(verifyUrl),
      }
    case 'signup':
    case 'invite':
    case 'magiclink':
    default:
      return {
        subject: isNewUser ? 'Bienvenido a PoliPlan' : 'Entrá a PoliPlan',
        html: renderMagicLinkEmail({ verifyUrl, isNewUser }),
      }
  }
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? Deno.env.get('AUTH_HOOK_SECRET')
  const rawBody = await request.text()

  let payload: AuthEmailHookPayload
  try {
    if (hookSecret) {
      const webhook = new Webhook(hookSecret)
      payload = webhook.verify(rawBody, Object.fromEntries(request.headers)) as AuthEmailHookPayload
    } else {
      payload = JSON.parse(rawBody) as AuthEmailHookPayload
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload'
    return jsonResponse({ error: message }, 401)
  }

  const email = payload.user.email?.trim().toLowerCase()
  if (!email) {
    return jsonResponse({ error: 'Missing user email' }, 400)
  }

  try {
    const { subject, html } = resolveAuthEmail(payload)
    await sendBrevoEmail({
      to: email,
      subject,
      html,
      tags: ['auth', payload.email_data.email_action_type ?? 'magiclink'],
    })
    return jsonResponse({})
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email'
    console.error('auth-send-email', message)
    return jsonResponse({ error: { http_code: 500, message } }, 500)
  }
})
