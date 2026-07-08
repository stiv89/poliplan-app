/** Placeholder de tarjetas mientras se carga el catálogo de una carrera/periodo. */
export function SectionListSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite" aria-label="Cargando materias">
      {Array.from({ length: count }, (_, index) => (
        <SectionCardSkeleton key={index} />
      ))}
    </div>
  )
}

function SectionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl bg-white px-3.5 py-3 ring-1 ring-slate-100/90">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-[72%] rounded-md bg-slate-200/90" />
          <div className="h-3 w-[45%] rounded-md bg-slate-100" />
          <div className="flex gap-2 pt-0.5">
            <div className="h-5 w-14 rounded-full bg-slate-100" />
            <div className="h-5 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100" />
      </div>
    </div>
  )
}
