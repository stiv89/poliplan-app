import { OFFICIAL_FPUNA_URL, PUBLIC_PAGE_SEO, PUBLIC_ROUTES } from '@/config/seo'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'
import { SeoHead } from '@/components/seo/SeoHead'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.fuentes]

export function FuentesPage() {
  return (
    <>
      <SeoHead meta={meta} />
      <article>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{meta.h1}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
          PoliPlan importa horarios y exámenes desde publicaciones oficiales de la Facultad
          Politécnica UNA. Cada versión queda registrada con fecha, archivo fuente y checksum para
          auditar cambios.
        </p>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Enlace principal</h2>
          <p className="mt-2 text-sm text-slate-600">
            Página institucional de horarios y exámenes:
          </p>
          <a
            href={OFFICIAL_FPUNA_URL}
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            rel="noopener noreferrer"
          >
            {OFFICIAL_FPUNA_URL}
          </a>
        </section>
        <div className="mt-10">
          <LegalDisclaimer />
        </div>
      </article>
    </>
  )
}
