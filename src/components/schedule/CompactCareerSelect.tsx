import { ChevronDown } from 'lucide-react'
import type { Career } from '@/types/academic'

interface CompactCareerSelectProps {
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  embedded?: boolean
  muted?: boolean
}

export function CompactCareerSelect({
  careers,
  selectedCareerId,
  onCareerChange,
  embedded = false,
  muted = false,
}: CompactCareerSelectProps) {
  return (
    <div className="relative shrink-0">
      <select
        value={selectedCareerId ?? ''}
        onChange={(e) => onCareerChange(e.target.value || null)}
        className={
          embedded
            ? `h-7 max-w-[5.5rem] appearance-none truncate bg-transparent pl-1 pr-5 text-xs font-semibold outline-none sm:max-w-[6.5rem] ${
                muted ? 'text-slate-700' : 'text-text'
              }`
            : 'h-8 max-w-[7.5rem] appearance-none truncate rounded-lg border border-slate-200 bg-white pl-2 pr-6 text-xs font-medium text-text outline-none transition hover:border-slate-300 focus:border-primary sm:max-w-[9.5rem]'
        }
        aria-label="Carrera"
      >
        <option value="">Carrera…</option>
        {careers.map((career) => (
          <option key={career.id} value={career.id}>
            {career.code ?? career.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 ${muted ? 'text-slate-500' : 'text-muted'} ${embedded ? 'right-0' : 'right-1.5'}`}
        aria-hidden="true"
      />
    </div>
  )
}
