import { renderEmailLayout } from './layout.ts'

function appUrl(): string {
  return Deno.env.get('APP_URL') ?? Deno.env.get('SITE_URL') ?? 'https://poliplan.app'
}

export function renderWelcomeEmail(name?: string | null): string {
  const greeting = name?.trim() ? `Hola, ${name.trim()}` : 'Hola'
  return renderEmailLayout({
    appUrl: appUrl(),
    previewText: 'Tu cuenta en PoliPlan está lista.',
    title: 'Bienvenido a PoliPlan',
    bodyHtml: `
      <p style="margin:0 0 12px;">${greeting}</p>
      <p style="margin:0 0 12px;">Ya podés armar tu horario, revisar materias y sincronizarlo entre dispositivos.</p>
      <p style="margin:0;">Empezá eligiendo tu carrera y periodo académico en el header.</p>
    `,
    ctaLabel: 'Abrir PoliPlan',
    ctaUrl: appUrl(),
    footerNote: 'Si no creaste esta cuenta, podés ignorar este correo.',
  })
}

export function renderMagicLinkEmail(options: {
  verifyUrl: string
  isNewUser: boolean
}): string {
  return renderEmailLayout({
    appUrl: appUrl(),
    previewText: options.isNewUser
      ? 'Bienvenido a PoliPlan. Confirmá tu acceso.'
      : 'Tu enlace de acceso a PoliPlan.',
    title: options.isNewUser ? 'Bienvenido a PoliPlan' : 'Iniciá sesión',
    bodyHtml: options.isNewUser
      ? `<p style="margin:0 0 12px;">Gracias por registrarte. Confirmá tu correo para entrar a PoliPlan y empezar a armar tu horario.</p>
         <p style="margin:0;">El enlace expira en poco tiempo por seguridad.</p>`
      : `<p style="margin:0 0 12px;">Usá el botón para entrar a tu cuenta de PoliPlan.</p>
         <p style="margin:0;">Si no pediste este acceso, ignorá este correo.</p>`,
    ctaLabel: options.isNewUser ? 'Confirmar y entrar' : 'Entrar a PoliPlan',
    ctaUrl: options.verifyUrl,
  })
}

export function renderOtpEmail(options: {
  code: string
  isNewUser: boolean
}): string {
  return renderEmailLayout({
    appUrl: appUrl(),
    previewText: `Tu código PoliPlan: ${options.code}`,
    title: options.isNewUser ? 'Bienvenido a PoliPlan' : 'Tu código de acceso',
    bodyHtml: `
      <p style="margin:0 0 16px;">${
        options.isNewUser
          ? 'Gracias por registrarte. Ingresá este código en PoliPlan para confirmar tu correo:'
          : 'Ingresá este código en PoliPlan para continuar:'
      }</p>
      <div style="margin:0 auto 16px;display:inline-block;padding:14px 22px;border-radius:12px;background:#F1F5F9;border:1px solid #E2E8F0;font-size:28px;letter-spacing:0.35em;font-weight:700;color:#0B3B8F;text-align:center;">
        ${options.code}
      </div>
      <p style="margin:0;">Expira en pocos minutos. No lo compartas con nadie.</p>
    `,
    footerNote: 'Si no pediste este código, podés ignorar este correo.',
  })
}

export function renderRecoveryEmail(verifyUrl: string): string {
  return renderEmailLayout({
    appUrl: appUrl(),
    previewText: 'Recuperá el acceso a tu cuenta PoliPlan.',
    title: 'Recuperar acceso',
    bodyHtml: `
      <p style="margin:0 0 12px;">Recibimos una solicitud para volver a entrar a tu cuenta.</p>
      <p style="margin:0;">Si fuiste vos, usá el botón de abajo. Si no, ignorá este correo.</p>
    `,
    ctaLabel: 'Recuperar acceso',
    ctaUrl: verifyUrl,
  })
}

export function renderEmailChangeEmail(verifyUrl: string): string {
  return renderEmailLayout({
    appUrl: appUrl(),
    previewText: 'Confirmá el cambio de correo en PoliPlan.',
    title: 'Confirmar nuevo correo',
    bodyHtml: `<p style="margin:0;">Confirmá el cambio de correo de tu cuenta PoliPlan.</p>`,
    ctaLabel: 'Confirmar correo',
    ctaUrl: verifyUrl,
  })
}

export function renderScheduleUpdateEmail(options: {
  periodName: string
  scheduleNames: string[]
}): string {
  const schedules =
    options.scheduleNames.length > 0
      ? options.scheduleNames.map((name) => `· ${name}`).join('<br />')
      : '· Tu horario guardado'

  return renderEmailLayout({
    appUrl: appUrl(),
    previewText: `Actualizamos el horario oficial de ${options.periodName}.`,
    title: 'Horario oficial actualizado',
    bodyHtml: `
      <p style="margin:0 0 12px;">La Facultad publicó una nueva versión del horario para <strong>${options.periodName}</strong>.</p>
      <p style="margin:0 0 12px;">Tenés horario(s) asociado(s) a ese periodo:</p>
      <p style="margin:0 0 12px;line-height:1.7;">${schedules}</p>
      <p style="margin:0;">Abrí PoliPlan para ver los cambios y revisar si algo de tu planificación se movió.</p>
    `,
    ctaLabel: 'Ver mi horario',
    ctaUrl: appUrl(),
    footerNote: 'Podés desactivar estos avisos en Configuración.',
  })
}

export function buildVerifyUrl(options: {
  siteUrl: string
  tokenHash: string
  emailActionType: string
  redirectTo: string
}): string {
  const base = options.siteUrl.replace(/\/$/, '')
  const redirect = encodeURIComponent(options.redirectTo || `${appUrl()}/`)
  return `${base}/auth/v1/verify?token=${options.tokenHash}&type=${options.emailActionType}&redirect_to=${redirect}`
}

export function isLikelyNewUser(createdAt?: string | null): boolean {
  if (!createdAt) return false
  const createdMs = Date.parse(createdAt)
  if (Number.isNaN(createdMs)) return false
  return Date.now() - createdMs < 5 * 60 * 1000
}
