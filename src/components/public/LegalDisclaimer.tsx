import { LEGAL_DISCLAIMER } from '@/config/seo'

export function LegalDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={
        compact
          ? 'text-xs leading-relaxed text-slate-500'
          : 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600'
      }
      role="note"
    >
      {LEGAL_DISCLAIMER}
    </p>
  )
}
