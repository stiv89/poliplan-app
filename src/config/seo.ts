export const SITE_NAME = 'PoliPlan'
export const SITE_TAGLINE = 'Horarios y herramientas para la Facultad Politécnica UNA'
export const CANONICAL_ORIGIN =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ??
  'https://www.poliplan.app'

export const LEGAL_DISCLAIMER =
  'PoliPlan es un proyecto independiente y no representa oficialmente a la FP-UNA ni a la UNA.'

export const OFFICIAL_FPUNA_URL =
  'https://www.pol.una.py/academico/horarios-de-clases-y-examenes/'

export const PUBLIC_ROUTES = {
  presentacion: '/presentacion',
  horarios: '/horarios-fpuna',
  examenes: '/examenes-fpuna',
  calculadora: '/calculadora-notas-fpuna',
  comoFunciona: '/como-funciona',
  fuentes: '/fuentes',
  avisoLegal: '/aviso-legal',
} as const

export type PublicSeoPath = (typeof PUBLIC_SEO_PATHS)[number]

export interface PageSeoMeta {
  path: PublicSeoPath
  title: string
  description: string
  keywords: string[]
  h1: string
  ogType?: 'website' | 'article'
}

export const PUBLIC_PAGE_SEO: Record<PublicSeoPath, PageSeoMeta> = {
  [PUBLIC_ROUTES.presentacion]: {
    path: PUBLIC_ROUTES.presentacion,
    title: 'PoliPlan — Horarios FP-UNA y Facultad Politécnica UNA',
    description:
      'Consultá horarios de la Facultad Politécnica UNA (FP-UNA), calendario de exámenes y calculadora de notas. PoliPlan organiza el horario politecnica en una sola app.',
    keywords: [
      'PoliPlan',
      'Poliplanner',
      'horario politecnica',
      'horarios FP-UNA',
      'Facultad Politécnica UNA',
    ],
    h1: 'PoliPlan: horarios de la Facultad Politécnica UNA, más simples',
  },
  [PUBLIC_ROUTES.horarios]: {
    path: PUBLIC_ROUTES.horarios,
    title: 'Horarios FP-UNA y Facultad Politécnica | PoliPlan',
    description:
      'Armá y consultá horarios de clases de la FP-UNA por carrera, materia y sección. PoliPlan sincroniza datos oficiales de la Facultad Politécnica UNA.',
    keywords: ['horario politecnica', 'horarios FP-UNA', 'Facultad Politécnica UNA', 'PoliPlan'],
    h1: 'Horarios FP-UNA por carrera y materia',
  },
  [PUBLIC_ROUTES.examenes]: {
    path: PUBLIC_ROUTES.examenes,
    title: 'Calendario de exámenes FP-UNA | PoliPlan',
    description:
      'Seguí fechas, horarios y aulas de parciales y finales de la Facultad Politécnica UNA. Calendario de exámenes FP-UNA integrado a tu planificación.',
    keywords: ['calendario exámenes FP-UNA', 'horarios FP-UNA', 'Facultad Politécnica UNA', 'PoliPlan'],
    h1: 'Calendario de exámenes FP-UNA',
  },
  [PUBLIC_ROUTES.calculadora]: {
    path: PUBLIC_ROUTES.calculadora,
    title: 'Calculadora de notas FP-UNA | PoliPlan',
    description:
      'Calculadora de notas FP-UNA con la escala oficial de la Facultad Politécnica. Estimá tu promedio y combinaciones de parcial, práctico y final.',
    keywords: ['calculadora de notas FP-UNA', 'Facultad Politécnica UNA', 'PoliPlan', 'Poliplanner'],
    h1: 'Calculadora de notas FP-UNA',
  },
  [PUBLIC_ROUTES.comoFunciona]: {
    path: PUBLIC_ROUTES.comoFunciona,
    title: 'Cómo funciona PoliPlan | Horarios FP-UNA',
    description:
      'Descubrí cómo PoliPlan importa horarios oficiales, detecta cambios y te ayuda a planificar materias, exámenes y notas de la FP-UNA.',
    keywords: ['PoliPlan', 'horarios FP-UNA', 'Facultad Politécnica UNA', 'Poliplanner'],
    h1: 'Cómo funciona PoliPlan',
  },
  [PUBLIC_ROUTES.fuentes]: {
    path: PUBLIC_ROUTES.fuentes,
    title: 'Fuentes oficiales de horarios FP-UNA | PoliPlan',
    description:
      'Transparencia sobre el origen de los datos: enlaces a publicaciones oficiales de la Facultad Politécnica UNA usadas por PoliPlan.',
    keywords: ['horarios FP-UNA', 'Facultad Politécnica UNA', 'PoliPlan', 'horario politecnica'],
    h1: 'Fuentes oficiales de horarios',
  },
  [PUBLIC_ROUTES.avisoLegal]: {
    path: PUBLIC_ROUTES.avisoLegal,
    title: 'Aviso legal | PoliPlan',
    description:
      'PoliPlan es un proyecto independiente. Aviso legal, limitaciones de responsabilidad y relación no oficial con la FP-UNA y la UNA.',
    keywords: ['PoliPlan', 'Facultad Politécnica UNA', 'FP-UNA'],
    h1: 'Aviso legal de PoliPlan',
  },
}

export const PUBLIC_NAV_LINKS = [
  { href: PUBLIC_ROUTES.horarios, label: 'Horarios' },
  { href: PUBLIC_ROUTES.examenes, label: 'Exámenes' },
  { href: PUBLIC_ROUTES.calculadora, label: 'Calculadora' },
  { href: PUBLIC_ROUTES.comoFunciona, label: 'Cómo funciona' },
  { href: PUBLIC_ROUTES.fuentes, label: 'Fuentes' },
  { href: PUBLIC_ROUTES.avisoLegal, label: 'Aviso legal' },
] as const

export const PUBLIC_SEO_PATHS = [
  PUBLIC_ROUTES.presentacion,
  PUBLIC_ROUTES.horarios,
  PUBLIC_ROUTES.examenes,
  PUBLIC_ROUTES.calculadora,
  PUBLIC_ROUTES.comoFunciona,
  PUBLIC_ROUTES.fuentes,
  PUBLIC_ROUTES.avisoLegal,
] as const

/** Rutas de la app interactiva (noindex en SEO). */
export const APP_NOINDEX_PATHS = [
  '/',
  '/secciones',
  '/examenes',
  '/calculadora',
  '/progreso',
  '/novedades',
  '/configuracion',
  '/offline',
  '/horario',
] as const
