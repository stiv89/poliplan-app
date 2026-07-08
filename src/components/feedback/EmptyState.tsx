import { AlertTriangle } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-surface p-6 text-center">
      <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="max-w-md text-sm text-muted">{description}</p>
    </div>
  )
}
