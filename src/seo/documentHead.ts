import { CANONICAL_ORIGIN, SITE_NAME, type PageSeoMeta } from '@/config/seo'
import { buildPublicPageJsonLd } from '@/seo/jsonLd'

export interface DocumentHeadOptions {
  meta: PageSeoMeta
  robots?: string
  faq?: { question: string; answer: string }[]
}

function canonicalUrl(path: string): string {
  if (path === '/') return `${CANONICAL_ORIGIN}/`
  return `${CANONICAL_ORIGIN}${path}`
}

export function buildDocumentHead({ meta, robots = 'index, follow', faq }: DocumentHeadOptions): string {
  const url = canonicalUrl(meta.path)
  const ogImage = `${CANONICAL_ORIGIN}/email/poliplan-logo.png`
  const jsonLd = JSON.stringify(buildPublicPageJsonLd(meta, faq)).replace(/</g, '\\u003c')

  return `
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeAttr(meta.description)}" />
    <meta name="keywords" content="${escapeAttr(meta.keywords.join(', '))}" />
    <meta name="robots" content="${escapeAttr(robots)}" />
    <link rel="canonical" href="${escapeAttr(url)}" />
    <meta property="og:site_name" content="${escapeAttr(SITE_NAME)}" />
    <meta property="og:title" content="${escapeAttr(meta.title)}" />
    <meta property="og:description" content="${escapeAttr(meta.description)}" />
    <meta property="og:url" content="${escapeAttr(url)}" />
    <meta property="og:type" content="${meta.ogType ?? 'website'}" />
    <meta property="og:locale" content="es_PY" />
    <meta property="og:image" content="${escapeAttr(ogImage)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeAttr(meta.title)}" />
    <meta name="twitter:description" content="${escapeAttr(meta.description)}" />
    <meta name="twitter:image" content="${escapeAttr(ogImage)}" />
    <script type="application/ld+json">${jsonLd}</script>
  `.trim()
}

export function buildAppDocumentHead(): string {
  return `
    <title>${escapeHtml(SITE_NAME)} — App</title>
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${escapeAttr(`${CANONICAL_ORIGIN}/horario`)}">
  `.trim()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;')
}

export function injectHeadIntoHtml(template: string, headHtml: string): string {
  const cleaned = template
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
  return cleaned.replace('</head>', `    ${headHtml}\n  </head>`)
}

export function injectRootHtml(template: string, appHtml: string): string {
  return template.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`,
  )
}
