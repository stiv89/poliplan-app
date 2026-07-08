import { renderToString } from 'react-dom/server'
import { createElement, type ReactElement } from 'react'
import { LANDING_FAQ } from '@/components/public/FaqSection'
import { PublicLayout } from '@/components/public/PublicLayout'
import {
  PUBLIC_PAGE_SEO,
  PUBLIC_ROUTES,
  PUBLIC_SEO_PATHS,
  type PublicSeoPath,
} from '@/config/seo'
import { AvisoLegalPage } from '@/pages/public/AvisoLegalPage'
import { CalculadoraNotasFpunaPage } from '@/pages/public/CalculadoraNotasFpunaPage'
import { ComoFuncionaPage } from '@/pages/public/ComoFuncionaPage'
import { ExamenesFpunaPage } from '@/pages/public/ExamenesFpunaPage'
import { FuentesPage } from '@/pages/public/FuentesPage'
import { HorariosFpunaPage } from '@/pages/public/HorariosFpunaPage'
import { LandingPage } from '@/pages/public/LandingPage'
import { buildDocumentHead } from '@/seo/documentHead'

const PAGE_BY_PATH: Record<PublicSeoPath, () => ReactElement> = {
  [PUBLIC_ROUTES.presentacion]: () => createElement(LandingPage),
  [PUBLIC_ROUTES.horarios]: () => createElement(HorariosFpunaPage),
  [PUBLIC_ROUTES.examenes]: () => createElement(ExamenesFpunaPage),
  [PUBLIC_ROUTES.calculadora]: () => createElement(CalculadoraNotasFpunaPage),
  [PUBLIC_ROUTES.comoFunciona]: () => createElement(ComoFuncionaPage),
  [PUBLIC_ROUTES.fuentes]: () => createElement(FuentesPage),
  [PUBLIC_ROUTES.avisoLegal]: () => createElement(AvisoLegalPage),
}

export function renderPublicPageHtml(path: PublicSeoPath): string {
  const Page = PAGE_BY_PATH[path]
  return renderToString(createElement(PublicLayout, { children: Page() }))
}

export function renderPublicPageHead(path: PublicSeoPath): string {
  const meta = PUBLIC_PAGE_SEO[path]
  const faq = path === PUBLIC_ROUTES.presentacion ? LANDING_FAQ : undefined
  return buildDocumentHead({ meta, faq })
}

export { PUBLIC_SEO_PATHS }
