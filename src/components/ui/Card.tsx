import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function Card({ title, children, className = '', action }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          {title ? <h2 className="text-base font-semibold text-text">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
