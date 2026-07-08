import type { CourseFootnoteKind } from '@/utils/courseFootnotes'

interface CourseFootnoteNoticeProps {
  kind: CourseFootnoteKind
  compact?: boolean
}

export function CourseFootnoteNotice({ kind, compact = false }: CourseFootnoteNoticeProps) {
  if (kind === 'final_exam_only') {
    return (
      <p
        className={`flex flex-wrap items-center gap-1 text-amber-800/90 ${
          compact ? 'text-[11px] leading-snug' : 'text-xs leading-relaxed'
        }`}
      >
        <span
          className="inline-flex shrink-0 items-center rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800"
          aria-hidden="true"
        >
          *
        </span>
        <span>
          Solo con derecho a examen final (DEF). Esta materia no se abre este periodo; podés
          agregarla para seguir el examen.
        </span>
      </p>
    )
  }

  return (
    <p
      className={`text-slate-500 ${compact ? 'text-[11px] leading-snug' : 'text-xs leading-relaxed'}`}
    >
      <span className="font-medium text-slate-600" aria-hidden="true">
        **
      </span>{' '}
      Ver horario de prácticas de laboratorio en el Excel oficial.
    </p>
  )
}
