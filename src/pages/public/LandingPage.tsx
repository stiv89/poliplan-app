import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { LandingAppPreview } from '@/components/public/LandingAppPreview'
import { PublicFooter } from '@/components/public/PublicFooter'
import { FaqSection, LANDING_FAQ } from '@/components/public/FaqSection'
import { SeoHead } from '@/components/seo/SeoHead'
import { ROUTES } from '@/config/constants'
import { PUBLIC_PAGE_SEO, PUBLIC_ROUTES, SITE_NAME } from '@/config/seo'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.presentacion]
const LOGO_URL = '/email/poliplan-logo.png'

const FPUNA_INSTITUTION = {
  id: 'fpuna',
  name: 'Facultad Politécnica — Universidad Nacional de Asunción',
  shortName: 'Facultad Politécnica UNA',
  location: 'Asunción, Paraguay',
  keywords: ['fpuna', 'politecnica', 'politécnica', 'una', 'asuncion', 'asunción', 'facultad'],
} as const

export function LandingPage() {
  const [query, setQuery] = useState('')

  const showInstitution = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return true
    return (
      FPUNA_INSTITUTION.keywords.some((term) => term.includes(normalized) || normalized.includes(term)) ||
      FPUNA_INSTITUTION.name.toLowerCase().includes(normalized) ||
      FPUNA_INSTITUTION.location.toLowerCase().includes(normalized)
    )
  }, [query])

  return (
    <>
      <SeoHead meta={meta} faq={LANDING_FAQ} />
      <div className="flex min-h-dvh flex-col bg-[#f4f7fb] text-slate-900">
        <header className="px-5 py-4 sm:px-8">
          <a href={PUBLIC_ROUTES.presentacion} className="inline-flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt={`Logo ${SITE_NAME}`}
              width={120}
              height={40}
              className="h-9 w-auto"
            />
            <span className="text-xl font-bold tracking-tight text-[#0B3B8F]">{SITE_NAME}</span>
          </a>
        </header>

        <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-10 px-5 pb-10 pt-2 lg:flex-row lg:items-center lg:gap-14 lg:px-8 lg:pb-16">
          <section className="flex min-w-0 flex-1 items-center justify-center lg:justify-end">
            <LandingAppPreview />
          </section>

          <section className="mx-auto w-full max-w-md shrink-0 lg:mx-0 lg:max-w-[360px]">
            <h1 className="text-[2rem] font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-[2.35rem]">
              Todo tu cuatrimestre
              <span className="block text-slate-700">en un solo lugar</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Horarios, exámenes y calculadora de notas para la Facultad Politécnica UNA.
            </p>

            <label className="relative mt-8 block">
              <span className="sr-only">Buscar facultades</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar facultades"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#0B3B8F]/35 focus:ring-2 focus:ring-[#0B3B8F]/10"
              />
            </label>

            <ul className="mt-4 space-y-3" aria-label="Facultades disponibles">
              {showInstitution ? (
                <li>
                  <a
                    href={ROUTES.home}
                    className="group block rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-[#0B3B8F]/25 hover:shadow-md"
                  >
                    <span className="block border-l-4 border-[#0B3B8F] pl-3">
                      <span className="block text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#0B3B8F]">
                        {FPUNA_INSTITUTION.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {FPUNA_INSTITUTION.location}
                      </span>
                    </span>
                  </a>
                </li>
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
                  No encontramos esa facultad todavía.
                </li>
              )}
            </ul>
          </section>
        </main>

        <div className="border-t border-slate-200/80 bg-white">
          <div className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8">
            <FaqSection items={LANDING_FAQ} />
          </div>
        </div>

        <PublicFooter />
      </div>
    </>
  )
}
