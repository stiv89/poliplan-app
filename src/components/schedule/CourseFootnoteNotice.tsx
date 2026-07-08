import { useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import type { CourseFootnoteKind } from '@/utils/courseFootnotes'

export const FINAL_EXAM_ONLY_PILL_LABEL = 'Solo examen final'
export const FINAL_EXAM_ONLY_DETAIL =
  'Tenés derecho a examen final. La materia no se abre este periodo, pero podés agregarla para seguir el examen.'

function ExpandableDetails({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="expandable-details" data-open={open ? 'true' : 'false'}>
      <div className="expandable-details-inner">
        <div className="pt-1.5 text-[11px] leading-relaxed text-slate-500">{children}</div>
      </div>
    </div>
  )
}

function FinalExamOnlyFootnote({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen((value) => !value)
        }}
        className="footnote-pill"
        aria-expanded={open}
        aria-label={`${FINAL_EXAM_ONLY_PILL_LABEL}. Más información`}
      >
        {FINAL_EXAM_ONLY_PILL_LABEL}
        <Info className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
      </button>
      <ExpandableDetails open={open}>{FINAL_EXAM_ONLY_DETAIL}</ExpandableDetails>
    </div>
  )
}

interface CourseFootnoteCardNoteProps {
  kind: CourseFootnoteKind
  /** Muestra el texto completo debajo (p. ej. panel de detalle). */
  showDetail?: boolean
}

export function CourseFootnoteCardNote({ kind, showDetail = false }: CourseFootnoteCardNoteProps) {
  if (kind === 'final_exam_only') {
    return <FinalExamOnlyFootnote defaultOpen={showDetail} />
  }

  return (
    <div className="min-w-0">
      <span className="inline-flex rounded-full bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-600">
        Prácticas lab
      </span>
      {showDetail && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
          Ver horario de prácticas de laboratorio en el Excel oficial.
        </p>
      )}
    </div>
  )
}

interface CourseFootnoteNoticeProps {
  kind: CourseFootnoteKind
  compact?: boolean
}

export function CourseFootnoteNotice({ kind, compact: _compact = false }: CourseFootnoteNoticeProps) {
  return <CourseFootnoteCardNote kind={kind} />
}
