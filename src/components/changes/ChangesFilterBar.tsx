import type { ChangeFilter } from '@/utils/changes'

interface ChangesFilterBarProps {
  value: ChangeFilter
  onChange: (value: ChangeFilter) => void
}

const OPTIONS: Array<{ value: ChangeFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'mine', label: 'Mi horario' },
  { value: 'exams', label: 'Exámenes' },
]

export function ChangesFilterBar({ value, onChange }: ChangesFilterBarProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-0.5">
      <div className="inline-flex min-w-0 gap-1 rounded-lg bg-slate-100 p-0.5">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              value === option.value
                ? 'bg-white text-text shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
