import { CANONICAL_ORIGIN, SITE_NAME, type PageSeoMeta } from '@/config/seo'

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
    logo: `${CANONICAL_ORIGIN}/favicon.png`,
    description:
      'Proyecto independiente que organiza horarios, exámenes y notas de la Facultad Politécnica UNA (FP-UNA).',
    sameAs: [],
    disambiguatingDescription:
      'PoliPlan no es un sitio oficial de la Facultad Politécnica UNA ni de la Universidad Nacional de Asunción.',
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: CANONICAL_ORIGIN,
    inLanguage: 'es-PY',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: CANONICAL_ORIGIN,
    },
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: CANONICAL_ORIGIN,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PYG',
    },
    description:
      'Planificador de horarios, exámenes y calculadora de notas para estudiantes de la FP-UNA.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  }
}

export function webPageJsonLd(meta: PageSeoMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: meta.title,
    description: meta.description,
    url: `${CANONICAL_ORIGIN}${meta.path}`,
    inLanguage: 'es-PY',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: CANONICAL_ORIGIN,
    },
  }
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function buildPublicPageJsonLd(meta: PageSeoMeta, faq?: { question: string; answer: string }[]) {
  const graph: Record<string, unknown>[] = [
    organizationJsonLd(),
    websiteJsonLd(),
    webPageJsonLd(meta),
    softwareApplicationJsonLd(),
  ]
  if (faq && faq.length > 0) {
    graph.push(faqJsonLd(faq))
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}
