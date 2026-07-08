import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import {
  DEFAULT_EXAM_FILTERS,
  type ExamFilterScope,
  type ExamFilters,
} from '@/utils/exams'

export function isExamFiltersActive(
  filters: ExamFilters,
  defaultScope: ExamFilterScope,
): boolean {
  return filters.scope !== defaultScope || filters.type !== 'all'
}

interface ExamFilterControlsProps {
  filters: ExamFilters
  defaultScope: ExamFilterScope
  onChange: (filters: ExamFilters) => void
}

function ExamFilterControls({ filters, defaultScope, onChange }: ExamFilterControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
          Mostrar
        </p>
        <div className="flex flex-wrap gap-1.5">
          <FilterPill
            label="Mis materias"
            active={filters.scope === 'mine'}
            onClick={() => onChange({ ...filters, scope: 'mine' })}
          />
          <FilterPill
            label="Todos los exámenes"
            active={filters.scope === 'all'}
            onClick={() => onChange({ ...filters, scope: 'all' })}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
          Tipo
        </p>
        <div className="flex flex-wrap gap-1.5">
          <FilterPill
            label="Todos"
            active={filters.type === 'all'}
            onClick={() => onChange({ ...filters, type: 'all' })}
          />
          <FilterPill
            label="Parciales"
            active={filters.type === 'parcial'}
            onClick={() => onChange({ ...filters, type: 'parcial' })}
          />
          <FilterPill
            label="Finales"
            active={filters.type === 'final'}
            onClick={() => onChange({ ...filters, type: 'final' })}
          />
          <FilterPill
            label="Recuperatorios"
            active={filters.type === 'recuperatorio'}
            onClick={() => onChange({ ...filters, type: 'recuperatorio' })}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...DEFAULT_EXAM_FILTERS, scope: defaultScope })}
        className="text-xs text-muted transition hover:text-text"
      >
        Restablecer filtros
      </button>
    </div>
  )
}

export function ExamFilterMenu({
  filters,
  defaultScope,
  onChange,
}: ExamFilterControlsProps & { defaultScope: ExamFilterScope }) {
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const active = isExamFiltersActive(filters, defaultScope)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const controls = (
    <ExamFilterControls filters={filters} defaultScope={defaultScope} onChange={onChange} />
  )

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (window.matchMedia('(min-width: 768px)').matches) {
            setOpen((value) => !value)
          } else {
            setMobileOpen(true)
          }
        }}
        className={`relative flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${
          open || mobileOpen || active
            ? 'border-primary/30 bg-primary/5 text-primary'
            : 'border-slate-200 text-muted hover:bg-slate-50'
        }`}
        aria-label="Filtros de exámenes"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Filtros
        {active && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        )}
      </button>

      <AnimatedPopover
        open={open}
        anchorRef={buttonRef}
        popoverRef={popoverRef}
        align="right"
        className="hidden w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl md:block"
      >
        {controls}
      </AnimatedPopover>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:hidden"
            role="dialog"
            aria-label="Filtros de exámenes"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-text">Filtros</p>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5">
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4">{controls}</div>
          </div>
        </>
      )}
    </>
  )
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
        active ? 'bg-primary text-white' : 'bg-slate-100 text-muted hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )
}
