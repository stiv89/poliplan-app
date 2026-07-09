import { LEGAL_DISCLAIMER } from '@/config/seo'

export function LegalDisclaimer({
  compact = false,
  className = '',
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <p
      className={
        compact
          ? `text-[11px] leading-snug text-slate-400 ${className}`
          : `rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600 ${className}`
      }
      role="note"
    >
      {LEGAL_DISCLAIMER}
    </p>
  )
}
