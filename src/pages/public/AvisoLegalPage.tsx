import { LEGAL_DISCLAIMER, PUBLIC_PAGE_SEO, PUBLIC_ROUTES } from '@/config/seo'
import { SeoHead } from '@/components/seo/SeoHead'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.avisoLegal]

export function AvisoLegalPage() {
  return (
    <>
      <SeoHead meta={meta} />
      <article>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{meta.h1}</h1>
        <div className="prose prose-slate mt-6 max-w-3xl space-y-4 text-slate-700">
          <p>{LEGAL_DISCLAIMER}</p>
          <p>
            Los horarios, exámenes y escalas de notas mostrados en PoliPlan se basan en fuentes
            públicas de la Facultad Politécnica UNA. Pueden existir errores de importación,
            demoras respecto a la publicación oficial o cambios de último momento en la facultad.
          </p>
          <p>
            Antes de tomar decisiones académicas (inscripciones, asistencia a exámenes, abandono de
            materias, etc.), confirmá siempre con secretaría académica, docentes o la web oficial de
            la FP-UNA.
          </p>
          <p>
            PoliPlan no garantiza disponibilidad continua del servicio. El uso de la aplicación es
            bajo tu responsabilidad.
          </p>
          <h2 className="text-xl font-semibold text-slate-900">Marcas</h2>
          <p>
            FP-UNA, UNA y demás nombres institucionales pertenecen a sus respectivos titulares.
            PoliPlan es un nombre de proyecto independiente y no implica respaldo universitario.
          </p>
        </div>
      </article>
    </>
  )
}
