import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { LandingAppPreview } from '@/components/public/LandingAppPreview'
import { LandingDoodleBackground } from '@/components/public/LandingDoodleBackground'
import { FPUNA_INSTITUTION, matchesFpunaInstitution } from '@/data/fpunaInstitution'
import { SITE_NAME } from '@/config/seo'

const LOGO_URL = '/email/poliplan-logo.png'

interface WelcomeFacultyModalProps {
  open: boolean
  onContinue: () => void
}

export function WelcomeFacultyModal({ open, onContinue }: WelcomeFacultyModalProps) {
  const [query, setQuery] = useState('')

  const showInstitution = useMemo(() => matchesFpunaInstitution(query), [query])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-faculty-title"
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[3px]" aria-hidden="true" />

      <div className="relative flex max-h-[94dvh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-[28px] border border-slate-200/80 bg-[#f4f7fb] shadow-2xl sm:max-h-[min(90dvh,720px)] sm:rounded-[28px]">
        <LandingDoodleBackground className="opacity-70" />

        <div className="relative z-10 flex shrink-0 items-center justify-center border-b border-slate-200/60 bg-white/80 px-5 py-3 backdrop-blur-sm">
          <img
            src={LOGO_URL}
            alt={`Logo ${SITE_NAME}`}
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </div>

        <div className="relative z-10 grid min-h-0 flex-1 gap-6 overflow-y-auto px-5 py-6 sm:grid-cols-[1fr_minmax(0,340px)] sm:px-8 sm:py-8">
          <section className="hidden min-w-0 items-center justify-center sm:flex">
            <LandingAppPreview />
          </section>

          <section className="mx-auto w-full max-w-md sm:mx-0 sm:max-w-none">
            <h1
              id="welcome-faculty-title"
              className="text-[1.75rem] font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-[2rem]"
            >
              Todo tu semestre
              <span className="block text-slate-700">en un solo lugar</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Horarios, exámenes y calculadora de notas para la Facultad Politécnica UNA.
            </p>

            <label className="relative mt-6 block">
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
                  <button
                    type="button"
                    onClick={onContinue}
                    className="group block w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-[#0B3B8F]/25 hover:shadow-md active:scale-[0.99]"
                  >
                    <span className="block border-l-4 border-[#0B3B8F] pl-3">
                      <span className="block text-sm font-semibold leading-snug text-slate-900 group-hover:text-[#0B3B8F]">
                        {FPUNA_INSTITUTION.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {FPUNA_INSTITUTION.location}
                      </span>
                    </span>
                  </button>
                </li>
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
                  No encontramos esa facultad todavía.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
