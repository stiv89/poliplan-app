import { loadAdminEnv } from './load-env.ts'

loadAdminEnv()

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const hookUrl = url ? `${url.replace(/\/$/, '')}/functions/v1/auth-send-email` : null

async function main() {
  if (!hookUrl) {
    console.error('Falta SUPABASE_URL o VITE_SUPABASE_URL en .env / .env.admin')
    process.exit(1)
  }

  const response = await fetch(hookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })

  const body = await response.text()

  console.log(
    JSON.stringify(
      {
        hookUrl,
        status: response.status,
        ok: response.ok,
        hint:
          response.status === 404
            ? 'La Edge Function auth-send-email NO está desplegada. Ejecutá: npx supabase login && npx supabase functions deploy auth-send-email --project-ref sfyovljgzriaquguygte --no-verify-jwt'
            : response.status === 401
              ? 'La función existe pero rechazó la firma (esperado sin headers del hook). Revisá SEND_EMAIL_HOOK_SECRET.'
              : response.status === 405
                ? 'Endpoint inesperado.'
                : 'La función responde. Si signup sigue fallando, revisá secrets (BREVO_API_KEY, EMAIL_FROM) y logs en Supabase.',
        bodyPreview: body.slice(0, 200),
      },
      null,
      2,
    ),
  )

  if (response.status === 404) process.exit(1)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
