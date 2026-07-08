import { PUBLIC_PAGE_SEO, PUBLIC_ROUTES } from '@/config/seo'
import { ROUTES } from '@/config/constants'
import { FaqSection, LANDING_FAQ } from '@/components/public/FaqSection'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'
import { SeoHead } from '@/components/seo/SeoHead'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.presentacion]

export function LandingPage() {
  return (
    <>
      <SeoHead meta={meta} faq={LANDING_FAQ} />
      <article>
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Facultad Politécnica UNA</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{meta.h1}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
          PoliPlan te ayuda a consultar <strong>horarios FP-UNA</strong>, seguir el{' '}
          <strong>calendario de exámenes</strong> y usar una{' '}
          <strong>calculadora de notas FP-UNA</strong> con la escala oficial. Si buscabas{' '}
          <em>Poliplanner</em> o un <em>horario politecnica</em> más claro, empezá acá.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={ROUTES.home}
            className="rounded-xl bg-[#0B3B8F] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0B3B8F]/90"
          >
            Usar PoliPlan gratis
          </a>
          <a
            href={PUBLIC_ROUTES.horarios}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Ver horarios FP-UNA
          </a>
        </div>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Horarios por carrera"
            description="Explorá materias y secciones del periodo activo de la Facultad Politécnica UNA."
            href={PUBLIC_ROUTES.horarios}
          />
          <FeatureCard
            title="Exámenes"
            description="Parciales y finales en un calendario pensado para planificar el cuatrimestre."
            href={PUBLIC_ROUTES.examenes}
          />
          <FeatureCard
            title="Calculadora de notas"
            description="Simulá combinaciones con la escala de la FP-UNA sin adivinar promedios."
            href={PUBLIC_ROUTES.calculadora}
          />
        </section>

        <div className="mt-10">
          <LegalDisclaimer />
        </div>

        <FaqSection items={LANDING_FAQ} />
      </article>
    </>
  )
}

function FeatureCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#0B3B8F]/30 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </a>
  )
}
