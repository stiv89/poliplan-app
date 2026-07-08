import { PUBLIC_PAGE_SEO, PUBLIC_ROUTES } from '@/config/seo'
import { ROUTES } from '@/config/constants'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'
import { SeoHead } from '@/components/seo/SeoHead'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.comoFunciona]

export function ComoFuncionaPage() {
  return (
    <>
      <SeoHead meta={meta} />
      <article>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{meta.h1}</h1>
        <ol className="mt-6 space-y-6 text-slate-700">
          <li className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">1. Elegí carrera y periodo</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Seleccioná tu carrera de la FP-UNA y el periodo académico que querés consultar.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">2. Agregá materias a tu horario</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Buscá secciones, revisá choques y guardá varios horarios si cursás más de un plan.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">3. Seguí cambios oficiales</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Cuando la facultad publica una versión nueva, PoliPlan compara y te muestra qué cambió.
            </p>
          </li>
          <li className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">4. Exámenes y notas</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Usá el calendario de exámenes y la calculadora de notas desde el mismo proyecto.
            </p>
          </li>
        </ol>
        <a
          href={ROUTES.home}
          className="mt-8 inline-flex rounded-xl bg-[#0B3B8F] px-5 py-3 text-sm font-semibold text-white"
        >
          Probar PoliPlan
        </a>
        <div className="mt-10">
          <LegalDisclaimer />
        </div>
      </article>
    </>
  )
}
