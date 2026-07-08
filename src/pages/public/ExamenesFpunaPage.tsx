import { PUBLIC_PAGE_SEO, PUBLIC_ROUTES } from '@/config/seo'
import { ROUTES } from '@/config/constants'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'
import { SeoHead } from '@/components/seo/SeoHead'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.examenes]

export function ExamenesFpunaPage() {
  return (
    <>
      <SeoHead meta={meta} />
      <article>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{meta.h1}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
          Consultá parciales, finales y recuperatorios de tus materias en un{' '}
          <strong>calendario de exámenes FP-UNA</strong>. Filtrá por fecha, tipo de examen o solo las
          materias que agregaste a tu horario en PoliPlan.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
          <li>Vista mensual y agenda por día.</li>
          <li>Detalle de aula, horario y docente cuando está publicado.</li>
          <li>Alertas cuando cambian fechas respecto a la versión anterior.</li>
        </ul>
        <a
          href={ROUTES.exams}
          className="mt-8 inline-flex rounded-xl bg-[#0B3B8F] px-5 py-3 text-sm font-semibold text-white"
        >
          Ver exámenes en la app
        </a>
        <div className="mt-10">
          <LegalDisclaimer />
        </div>
      </article>
    </>
  )
}
