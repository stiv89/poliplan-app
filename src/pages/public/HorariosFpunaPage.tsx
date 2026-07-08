import { OFFICIAL_FPUNA_URL, PUBLIC_PAGE_SEO, PUBLIC_ROUTES } from '@/config/seo'
import { ROUTES } from '@/config/constants'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'
import { SeoHead } from '@/components/seo/SeoHead'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.horarios]

export function HorariosFpunaPage() {
  return (
    <>
      <SeoHead meta={meta} />
      <article>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{meta.h1}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
          En PoliPlan podés armar tu <strong>horario politecnica</strong> eligiendo carrera, periodo
          académico y secciones. Los datos provienen de publicaciones oficiales de la{' '}
          <strong>Facultad Politécnica UNA</strong> y se actualizan cuando la facultad publica una
          versión nueva.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-slate-700">
          <li>Buscador de materias con secciones, turnos y docentes.</li>
          <li>Detección de choques de horario al agregar clases.</li>
          <li>Sincronización en la nube para retomar en otro dispositivo.</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={ROUTES.home}
            className="rounded-xl bg-[#0B3B8F] px-5 py-3 text-sm font-semibold text-white"
          >
            Armar mi horario
          </a>
          <a
            href={OFFICIAL_FPUNA_URL}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800"
            rel="noopener noreferrer"
          >
            Fuente oficial FP-UNA
          </a>
        </div>
        <div className="mt-10">
          <LegalDisclaimer />
        </div>
      </article>
    </>
  )
}
