import { PUBLIC_PAGE_SEO, PUBLIC_ROUTES } from '@/config/seo'
import { ROUTES } from '@/config/constants'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'
import { SeoHead } from '@/components/seo/SeoHead'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.calculadora]

export function CalculadoraNotasFpunaPage() {
  return (
    <>
      <SeoHead meta={meta} />
      <article>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{meta.h1}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
          La <strong>calculadora de notas FP-UNA</strong> de PoliPlan usa la escala oficial de la
          Facultad Politécnica para estimar promedios, mínimos en final y combinaciones de parcial,
          práctico y recuperatorio.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
          <li>Modo “tengo parcial” y simulaciones rápidas.</li>
          <li>Resultados orientativos — siempre confirmá con reglamento vigente.</li>
          <li>Acceso directo desde la app, sin instalar nada extra.</li>
        </ul>
        <a
          href={ROUTES.grading}
          className="mt-8 inline-flex rounded-xl bg-[#0B3B8F] px-5 py-3 text-sm font-semibold text-white"
        >
          Abrir calculadora
        </a>
        <div className="mt-10">
          <LegalDisclaimer />
        </div>
      </article>
    </>
  )
}
