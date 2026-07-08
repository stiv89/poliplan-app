export interface EmailLayoutOptions {
  appUrl: string
  previewText: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const logoUrl = `${options.appUrl.replace(/\/$/, '')}/email/poliplan-logo.png`
  const ctaBlock =
    options.ctaLabel && options.ctaUrl
      ? `<tr>
          <td style="padding:28px 32px 8px;text-align:center;">
            <a href="${options.ctaUrl}" style="display:inline-block;background:#0B3B8F;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;">
              ${options.ctaLabel}
            </a>
          </td>
        </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${options.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${options.previewText}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8FAFC;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 12px;text-align:center;background:#ffffff;">
                <img src="${logoUrl}" width="120" height="auto" alt="PoliPlan" style="display:block;margin:0 auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;text-align:center;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:700;color:#0F172A;">${options.title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px;font-size:15px;line-height:1.6;color:#475569;">
                ${options.bodyHtml}
              </td>
            </tr>
            ${ctaBlock}
            <tr>
              <td style="padding:24px 32px 28px;font-size:12px;line-height:1.5;color:#94A3B8;text-align:center;border-top:1px solid #F1F5F9;">
                ${options.footerNote ?? 'PoliPlan — horarios de la Facultad Politécnica, más simples.'}
                <br />
                <span style="color:#CBD5E1;">noreply@poliplan.app</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
