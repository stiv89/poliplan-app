interface FaqItem {
  question: string
  answer: string
}

interface FaqSectionProps {
  items: FaqItem[]
  title?: string
}

export function FaqSection({ items, title = 'Preguntas frecuentes' }: FaqSectionProps) {
  return (
    <section aria-labelledby="faq-heading" className="mt-10">
      <h2 id="faq-heading" className="text-xl font-semibold text-slate-900">
        {title}
      </h2>
      <dl className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.question} className="rounded-xl border border-slate-200 bg-white p-4">
            <dt className="font-medium text-slate-900">{item.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export const LANDING_FAQ: FaqItem[] = [
  {
    question: '¿Buscabas Poliplanner?',
    answer:
      'PoliPlan es el nombre actual del proyecto. Si llegaste buscando “Poliplanner”, estás en el lugar correcto: horarios, exámenes y calculadora de notas para la FP-UNA. No somos una app oficial de la facultad.',
  },
  {
    question: '¿PoliPlan es oficial de la FP-UNA?',
    answer:
      'No. PoliPlan es un proyecto independiente que organiza datos publicados por la Facultad Politécnica UNA. Siempre verificá cambios en las fuentes oficiales.',
  },
  {
    question: '¿Puedo ver horarios de la Facultad Politécnica UNA?',
    answer:
      'Sí. Podés explorar horarios por carrera y periodo, agregar materias a tu planificación y sincronizar entre dispositivos con una cuenta gratuita.',
  },
]
