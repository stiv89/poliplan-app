import { LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div
      className="flex min-h-40 flex-col items-center justify-center gap-3 text-muted"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
